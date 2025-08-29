import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.SES_REGION!,
  credentials: {
    accessKeyId: process.env.AMP_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AMP_AWS_SECRET_ACCESS_KEY!,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const senderEmail = from || process.env.SES_FROM_EMAIL;
  const senderName = process.env.SES_FROM_NAME;

  if (!senderEmail) {
    throw new Error("SES_FROM_EMAIL environment variable is required");
  }

  // Format sender with name if provided
  const formattedSender = senderName ? `${senderName} <${senderEmail}>` : senderEmail;
  const command = new SendEmailCommand({
    Source: formattedSender,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: html,
          Charset: "UTF-8",
        },
      },
    },
  });

  return await sesClient.send(command);
}
