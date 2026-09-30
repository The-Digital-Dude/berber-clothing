import QRCode from "qrcode"

// Code 128B barcode pattern generator for pure SVG rendering (works on server & client without DOM)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
]

export function generateCode128Svg(text: string, height: number = 28): string {
  if (!text) return ""
  const cleanText = text.replace(/[^ -~]/g, "")
  const codes: number[] = [104] // Start code B
  let checkSum = 104

  for (let i = 0; i < cleanText.length; i++) {
    const code = cleanText.charCodeAt(i) - 32
    codes.push(code)
    checkSum += code * (i + 1)
  }

  codes.push(checkSum % 103)
  codes.push(106) // Stop code

  let patternStr = ""
  for (const c of codes) {
    patternStr += CODE128_PATTERNS[c] || ""
  }

  let totalWidth = 0
  for (const char of patternStr) {
    totalWidth += parseInt(char, 10)
  }

  let svgBars = ""
  let currentX = 0
  let isBar = true

  for (const char of patternStr) {
    const width = parseInt(char, 10)
    if (isBar) {
      svgBars += `<rect x="${currentX}" y="0" width="${width}" height="${height}" fill="#000" />`
    }
    currentX += width
    isBar = !isBar
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" width="100%" height="${height}" preserveAspectRatio="none" style="display:block;">${svgBars}</svg>`
}

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 0,
      width: 80,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
  } catch {
    return ""
  }
}
