// Add this file to check your environment setup
export function checkEnvironment() {
  console.log("🔍 Environment Check:")
  console.log("PHONE_NUMBER_ID:", process.env.PHONE_NUMBER_ID ? "✅ Set" : "❌ Missing")
  console.log("WHATSAPP_AUTH_TOKEN:", process.env.WHATSAPP_AUTH_TOKEN ? "✅ Set" : "❌ Missing")
  console.log("WHATSAPP_VERIFY_TOKEN:", process.env.WHATSAPP_VERIFY_TOKEN ? "✅ Set" : "❌ Missing")
  console.log("PORT:", process.env.PORT || "3000")

  // Check if tokens are not just dummy values
  if (process.env.WHATSAPP_AUTH_TOKEN === "dummy_token") {
    console.log("⚠️  WARNING: Using dummy WhatsApp token!")
  }

  if (!process.env.PHONE_NUMBER_ID) {
    console.log("❌ PHONE_NUMBER_ID is required for WhatsApp API")
  }
}
