# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Sign In" [level=3] [ref=e6]
      - paragraph [ref=e7]: Welcome back to KStoryBridge
    - generic [ref=e8]:
      - generic [ref=e9]: Invalid login credentials
      - button "Continue with Google" [ref=e11] [cursor=pointer]:
        - img [ref=e12]
        - text: Continue with Google
      - generic [ref=e21]: Or sign in with email
      - generic [ref=e22]:
        - generic [ref=e23]:
          - text: Email
          - textbox "Email" [ref=e24]:
            - /placeholder: creator@example.com
            - text: invalid@example.com
        - generic [ref=e25]:
          - text: Password
          - textbox "Password" [ref=e26]:
            - /placeholder: Enter your password
            - text: wrong-password
        - button "Sign In" [ref=e27] [cursor=pointer]
      - generic [ref=e28]:
        - text: Don't have an account?
        - link "Sign up" [ref=e29] [cursor=pointer]:
          - /url: /signup
```