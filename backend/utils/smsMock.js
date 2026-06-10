const axios = require("axios");

exports.sendSMS = async (phone, message) => {
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message,
        language: "english",
        flash: 0,
        numbers: phone.startsWith("91")
          ? phone
          : `91${phone}`
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("SMS SENT:", response.data);
  } catch (error) {
    console.error(
      "SMS FAILED:",
      error.response?.data || error.message
    );
  }
};