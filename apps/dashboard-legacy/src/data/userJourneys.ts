export const buyerJourneyMermaid = `
graph TD
    Start([Website Landing Page]) --> SignupChoice{Choose Account Type}

    SignupChoice -->|Buyer| BuyerSignup["Buyer Signup<br/>/signup/buyer"]

    BuyerSignup --> SignupMethod{Signup Method}
    SignupMethod -->|Email| BuyerForm["Fill Form<br/>Name, Company, Role"]
    SignupMethod -->|Google OAuth| GoogleAuth["Google Authentication"]

    BuyerForm --> EmailVerification["Email Verification Sent"]
    GoogleAuth --> OAuthCallback["OAuth Callback<br/>/auth/callback"]
    OAuthCallback --> CompleteProfile["Complete Profile Form"]
    CompleteProfile --> EmailVerification

    EmailVerification --> Signin["Sign In Page<br/>/signin"]

    Signin --> BuyerHome["AI Chat Discovery<br/>/buyers/home"]

    BuyerHome --> Featured["Featured Titles<br/>/buyers/featured"]
    BuyerHome --> Titles["Browse All Titles<br/>/buyers/titles"]
    BuyerHome --> Favorites["Saved Titles<br/>/buyers/saved"]
    BuyerHome --> News["Industry News<br/>/buyers/news"]
    BuyerHome --> Profile["My Profile<br/>/buyers/profile"]

    Titles --> TitleDetail["Title Detail<br/>/buyers/titles/:id"]
    Featured --> TitleDetail
    Favorites --> TitleDetail

    TitleDetail --> TierCheck{Tier Access}
    TierCheck -->|Basic| BasicContent["Limited Content<br/>Synopsis, Genre, Author"]
    TierCheck -->|Pro/Suite| PremiumContent["Full Access<br/>Pitch Deck + Contact Info + Rights"]

    Profile --> PlanUpgrade["Upgrade to Pro/Suite<br/>/buyers/plan"]
    PlanUpgrade --> PaymentSuccess["Payment Complete<br/>/payment/success"]
    PaymentSuccess --> Profile

    style Start fill:#e3f2fd
    style BuyerSignup fill:#fff3e0
    style Signin fill:#fff3e0
    style BuyerHome fill:#e8f5e9
    style Featured fill:#f3e5f5
    style Titles fill:#f3e5f5
    style Favorites fill:#f3e5f5
    style News fill:#f3e5f5
    style Profile fill:#f3e5f5
    style TitleDetail fill:#e1f5fe
    style PremiumContent fill:#c8e6c9
    style PlanUpgrade fill:#ffe0b2
`;

export const creatorJourneyMermaid = `
graph TD
    Start([Website Landing Page]) --> SignupChoice{Choose Account Type}

    SignupChoice -->|Creator| CreatorSignup["Creator Signup<br/>/signup/creator"]

    CreatorSignup --> SignupMethod{Signup Method}
    SignupMethod -->|Email| CreatorForm["Fill Form<br/>Name, Pen Name, Role"]
    SignupMethod -->|Google OAuth| GoogleAuth["Google Authentication"]

    CreatorForm --> EmailVerification["Email Verification Sent"]
    GoogleAuth --> OAuthCallback["OAuth Callback<br/>/auth/callback"]
    OAuthCallback --> CompleteProfile["Complete Profile Form"]
    CompleteProfile --> EmailVerification

    EmailVerification --> Signin["Sign In Page<br/>/signin"]

    Signin --> CreatorHome["My Titles Dashboard<br/>/creators/home"]

    CreatorHome --> AddTitle["Add New Title<br/>/creators/titles/add"]
    CreatorHome --> EditTitle["Edit Title<br/>/creators/titles/:id/edit"]
    CreatorHome --> ViewTitle["View Title Detail<br/>/creators/titles/:id"]
    CreatorHome --> News["Industry News<br/>/creators/news"]
    CreatorHome --> Profile["My Profile<br/>/creators/profile"]

    AddTitle --> TitleForm["Fill Title Information<br/>Name, Genre, Synopsis, Author, Format"]
    TitleForm --> TitlePublished["Title Published"]
    TitlePublished --> CreatorHome

    EditTitle --> UpdateForm["Update Title Information"]
    UpdateForm --> TitleUpdated["Changes Saved"]
    TitleUpdated --> CreatorHome

    ViewTitle --> TitlePreview["See Buyer View<br/>How your title appears to buyers"]
    TitlePreview --> CreatorHome

    Profile --> UpdateProfile["Update Profile<br/>Pen Name, Company, Contact Info"]
    UpdateProfile --> Profile

    style Start fill:#e3f2fd
    style CreatorSignup fill:#fff3e0
    style Signin fill:#fff3e0
    style CreatorHome fill:#e8f5e9
    style AddTitle fill:#fff9c4
    style EditTitle fill:#fff9c4
    style ViewTitle fill:#f3e5f5
    style News fill:#f3e5f5
    style Profile fill:#f3e5f5
    style TitlePublished fill:#c8e6c9
    style TitleUpdated fill:#c8e6c9
`;

export const authFlowMermaid = `
graph TD
    Start([User Arrives]) --> HasAccount{Has Account?}

    HasAccount -->|No| SignupType{Account Type}
    SignupType -->|Buyer| BuyerSignup["Buyer Signup<br/>/signup/buyer"]
    SignupType -->|Creator| CreatorSignup["Creator Signup<br/>/signup/creator"]

    BuyerSignup --> SignupMethod{Signup Method}
    CreatorSignup --> SignupMethod

    SignupMethod -->|Email/Password| EmailSignup["Submit Email Form"]
    SignupMethod -->|Google OAuth| OAuthFlow["Google OAuth Flow"]

    EmailSignup --> EmailSent["Verification Email Sent"]
    EmailSent --> CheckEmail["User Checks Email"]
    CheckEmail --> VerifyLink["Click Verification Link"]
    VerifyLink --> EmailVerified["Email Verified"]

    OAuthFlow --> OAuthCallback["OAuth Callback<br/>/auth/callback"]
    OAuthCallback --> ProfileComplete{Profile Complete?}
    ProfileComplete -->|No| CompleteProfile["Complete Profile Form"]
    ProfileComplete -->|Yes| OAuthDone["OAuth Complete"]
    CompleteProfile --> OAuthDone

    EmailVerified --> SigninPage["Sign In Page<br/>/signin"]
    OAuthDone --> SigninPage
    HasAccount -->|Yes| SigninPage

    SigninPage --> SigninMethod{Signin Method}
    SigninMethod -->|Email/Password| EmailSignin["Enter Credentials"]
    SigninMethod -->|Google OAuth| OAuthSignin["Google OAuth"]

    EmailSignin --> CredentialsCheck{Valid?}
    CredentialsCheck -->|No| SigninError["Show Error Message"]
    SigninError --> SigninPage
    CredentialsCheck -->|Yes| SessionCreated["Session Created"]

    OAuthSignin --> OAuthCallback

    SessionCreated --> AccountTypeCheck{Account Type}
    AccountTypeCheck -->|Buyer| BuyerDashboard["Buyer Dashboard<br/>/buyers/home"]
    AccountTypeCheck -->|Creator| CreatorDashboard["Creator Dashboard<br/>/creators/home"]

    SigninPage --> ForgotPassword["Forgot Password<br/>/forgot-password"]
    ForgotPassword --> ResetEmail["Reset Email Sent"]
    ResetEmail --> ResetLink["Click Reset Link"]
    ResetLink --> NewPassword["Enter New Password"]
    NewPassword --> PasswordReset["Password Reset"]
    PasswordReset --> SigninPage

    style Start fill:#e3f2fd
    style BuyerSignup fill:#fff3e0
    style CreatorSignup fill:#fff3e0
    style SigninPage fill:#fff3e0
    style EmailVerified fill:#c8e6c9
    style OAuthDone fill:#c8e6c9
    style SessionCreated fill:#c8e6c9
    style PasswordReset fill:#c8e6c9
    style BuyerDashboard fill:#e8f5e9
    style CreatorDashboard fill:#e8f5e9
    style SigninError fill:#ffcdd2
`;

export interface JourneyDefinition {
  id: string;
  title: string;
  description: string;
  mermaidCode: string;
}

export const userJourneys: JourneyDefinition[] = [
  {
    id: 'buyer',
    title: 'Buyer Journey',
    description: 'Complete flow for buyers from signup to browsing titles and upgrading plans',
    mermaidCode: buyerJourneyMermaid
  },
  {
    id: 'creator',
    title: 'Creator Journey',
    description: 'Complete flow for creators from signup to managing their content catalog',
    mermaidCode: creatorJourneyMermaid
  },
  {
    id: 'auth',
    title: 'Authentication Flow',
    description: 'Detailed authentication process including email verification, OAuth, and password reset',
    mermaidCode: authFlowMermaid
  }
];