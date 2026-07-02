require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function updateAdminMetadata() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase URL or Service Role Key in .env.local");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return console.error(listError);
  
  const user = users.users.find(u => u.email === 'admin@store.com');
  if (user) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: { role: 'ADMIN' },
      user_metadata: { name: 'Admin' }
    });
    if (updateError) {
       console.error("Error updating user:", updateError);
    } else {
       console.log("Successfully updated admin metadata. They are now officially recognized as ADMIN in Supabase Auth.");
    }
  } else {
    console.log("User not found");
  }
}

updateAdminMetadata();
