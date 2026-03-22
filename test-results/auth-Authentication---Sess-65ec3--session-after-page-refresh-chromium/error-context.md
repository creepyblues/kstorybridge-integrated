# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Producer Sign In" [level=3] [ref=e6]
      - paragraph [ref=e7]: Welcome back! Sign in to your producer account.
    - generic [ref=e8]:
      - generic [ref=e9]:
        - generic [ref=e10]:
          - text: Email
          - textbox "Email" [ref=e11]:
            - /placeholder: you@company.com
            - text: test-buyer@example.com
        - generic [ref=e12]:
          - text: Password
          - textbox "Password" [ref=e13]:
            - /placeholder: ••••••••
            - text: test-password-123
        - button "Sign In" [ref=e14] [cursor=pointer]
      - generic [ref=e19]: or
      - button "Continue with Google" [ref=e20] [cursor=pointer]:
        - img [ref=e21]
        - text: Continue with Google
      - link "Forgot your password?" [ref=e27] [cursor=pointer]:
        - /url: /forgot-password
      - generic [ref=e28]:
        - text: Don't have a producer account?
        - link "Sign up here" [ref=e29] [cursor=pointer]:
          - /url: /signup
  - region "Notifications (F8)":
    - list
```