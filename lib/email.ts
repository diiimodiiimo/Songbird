// Email service wrapper
// Currently a placeholder - implement with Resend, SendGrid, or similar service

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email
 * TODO: Implement with actual email service (Resend, SendGrid, etc.)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  // Placeholder implementation
  console.log('[email] Would send email:', {
    to: options.to,
    subject: options.subject,
  })
  
  // In production, implement with actual email service:
  // const resend = new Resend(process.env.RESEND_API_KEY)
  // await resend.emails.send({
  //   from: 'SongBird <noreply@songbird.app>',
  //   to: options.to,
  //   subject: options.subject,
  //   html: options.html,
  //   text: options.text,
  // })
}

/**
 * Send waitlist confirmation email
 */
export async function sendWaitlistConfirmation(email: string, referralCode: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Welcome to the SongBird Waitlist!',
    html: `
      <h1>Welcome to SongBird!</h1>
      <p>You're on the waitlist. We'll notify you when SongBird launches.</p>
      <p>Your referral code: <strong>${referralCode}</strong></p>
      <p>Share with friends: ${process.env.NEXT_PUBLIC_APP_URL || 'https://songbird.app'}/waitlist?ref=${referralCode}</p>
    `,
    text: `Welcome to SongBird! You're on the waitlist. Your referral code: ${referralCode}`,
  })
}

/**
 * Send invitation email to waitlist user
 */
export async function sendWaitlistInvitation(email: string, name?: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'You\'re Invited to SongBird!',
    html: `
      <h1>You're Invited!</h1>
      <p>${name ? `Hi ${name},` : 'Hi,'}</p>
      <p>SongBird is now live! Join us and start tracking your daily songs.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://songbird.app'}/home">Get Started</a></p>
      <p>As a waitlist member, you're eligible for Founding Flock - lifetime premium at $24/year!</p>
    `,
    text: `SongBird is now live! Join us at ${process.env.NEXT_PUBLIC_APP_URL || 'https://songbird.app'}/home`,
  })
}


