const mail = {
  buttonFallback: "If the button doesn't work, paste this link into your browser:",
  tagline: "Duffle · One place for the whole trip.",
  notConfigured: "Email delivery is not configured yet.",
  sendFailed: "Could not send the email. Try again.",
  verify: {
    subject: "Confirm your Duffle account",
    heading: "Confirm your email",
    body: "Welcome to Duffle! Confirm {email} to finish setting up your account.",
    action: "Confirm email",
    note: "This link expires in 24 hours. If you didn't create an account, you can ignore this email.",
  },
  existing: {
    subject: "Your Duffle account",
    heading: "You already have an account",
    google: "The account for {email} uses Google sign-in. Sign in with Google to get back to your trips.",
    password: "An account for {email} already exists. Sign in, or reset the password if you've forgotten it.",
    signInGoogle: "Sign in with Google",
    signIn: "Sign in",
    resetPassword: "Reset password",
    note: "If you didn't ask for this, you can ignore this email.",
  },
  reset: {
    subject: "Reset your Duffle password",
    heading: "Reset your password",
    body: "We got a request to reset the password for {email}. Choose a new one below.",
    action: "Reset password",
    note: "This link expires in one hour. If you didn't ask for this, you can ignore this email — your password won't change.",
  },
};

export default mail;
