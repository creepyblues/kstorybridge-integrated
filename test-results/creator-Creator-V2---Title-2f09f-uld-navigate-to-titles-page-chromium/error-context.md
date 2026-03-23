# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Creator Sign In" [level=3] [ref=e6]
      - paragraph [ref=e7]: Welcome back!
    - generic [ref=e8]:
      - generic [ref=e9]:
        - heading "Verify Your Email" [level=3] [ref=e10]
        - paragraph [ref=e11]: We've sent a verification link to test-creator@example.com.
        - generic [ref=e12]:
          - button "Resend verification email" [ref=e13] [cursor=pointer]
          - button "Dismiss" [ref=e14] [cursor=pointer]
      - generic [ref=e15]: Please verify your email address before signing in.
      - button "Continue with Google" [ref=e17] [cursor=pointer]:
        - img [ref=e18]
        - text: Continue with Google
      - generic [ref=e27]: or
      - generic [ref=e28]:
        - generic [ref=e29]:
          - text: Email
          - textbox "Email" [ref=e30]:
            - /placeholder: creator@example.com
            - text: test-creator@example.com
        - generic [ref=e31]:
          - text: Password
          - textbox "Password" [ref=e32]:
            - /placeholder: Enter your password
            - text: test-password-123
        - button "Sign In" [ref=e33] [cursor=pointer]
      - button "Didn't receive verification email?" [ref=e35] [cursor=pointer]
      - generic [ref=e36]:
        - text: Don't have an account?
        - link "Sign up" [ref=e37] [cursor=pointer]:
          - /url: /signup
```