require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function createAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase URL or Service Role Key in .env.local");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const email = 'admin@store.com';
  const password = 'Admin@1234';

  console.log(`Attempting to create user: ${email} in Supabase Auth...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true // bypass email confirmation
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log(`User ${email} already exists. Attempting to update password and confirm email...`);
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error("Error listing users:", listError);
        return;
      }
      
      const user = users.users.find(u => u.email === email);
      if (user) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
          password: password,
          email_confirm: true
        });
        if (updateError) {
           console.error("Error updating user:", updateError);
        } else {
           console.log("Successfully updated existing user password and confirmed email.");
        }
      }
    } else {
      console.error("Error creating user:", error);
    }
  } else {
    console.log("Successfully created user in Supabase Auth:", data.user.id);
  }
}

createAdmin();
