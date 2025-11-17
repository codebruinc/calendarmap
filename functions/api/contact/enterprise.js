export async function onRequestPost(context) {
  const { request, env } = context;

  console.log('Enterprise contact form submission received');

  try {
    const body = await request.json();
    const { name, email, description, source } = body;

    // Validate required fields
    if (!name || !email || !description) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if email service is configured
    if (!env.EMAIL_API_ID || !env.EMAIL_API_SECRET) {
      console.error('Email API credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Prepare email content
    const emailSubject = `CalendarMap Enterprise Inquiry from ${name}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Enterprise Contact Form Submission</h2>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Name:</strong> ${name}</p>
          <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p style="margin: 10px 0;"><strong>Source:</strong> ${source || 'Not specified'}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #374151;">How they use calendars:</h3>
          <p style="white-space: pre-wrap; background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; border-radius: 4px;">
            ${description}
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

        <p style="color: #6b7280; font-size: 12px;">
          Submitted from CalendarMap.app at ${new Date().toISOString()}
        </p>
      </div>
    `;

    const emailText = `
New Enterprise Contact Form Submission

Name: ${name}
Email: ${email}
Source: ${source || 'Not specified'}

How they use calendars:
${description}

---
Submitted from CalendarMap.app at ${new Date().toISOString()}
    `;

    // Step 1: Get OAuth access token from SendPulse
    const tokenResponse = await fetch('https://api.sendpulse.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: env.EMAIL_API_ID,
        client_secret: env.EMAIL_API_SECRET
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('SendPulse OAuth error:', errorText);
      return new Response(
        JSON.stringify({
          error: 'Failed to authenticate with email service',
          details: `OAuth returned ${tokenResponse.status}`
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('OAuth token obtained successfully');

    // Step 2: Send email via SendPulse SMTP API
    // HTML must be Base64 encoded per SendPulse requirements
    const htmlBase64 = btoa(unescape(encodeURIComponent(emailHtml)));

    const emailApiResponse = await fetch('https://api.sendpulse.com/smtp/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: {
          subject: emailSubject,
          from: {
            name: `${name} (via CalendarMap)`,
            email: email
          },
          to: [
            {
              name: 'CodeBru Support',
              email: 'support@codebru.com'
            }
          ],
          html: htmlBase64,
          text: emailText
        }
      }),
    });

    console.log('SendPulse email API response status:', emailApiResponse.status);

    if (!emailApiResponse.ok) {
      const errorText = await emailApiResponse.text();
      console.error('SendPulse email API error:', errorText);

      return new Response(
        JSON.stringify({
          error: 'Failed to send email',
          details: `SendPulse API returned ${emailApiResponse.status}`,
          debug: errorText
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Email sent successfully to support@codebru.com via SendPulse');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Form submitted successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Enterprise contact form error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({
        error: 'Failed to process form submission',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
