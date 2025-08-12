import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Switch } from "@kstorybridge/ui";

import { 
  Settings as SettingsIcon, 
  Globe, 
  Shield, 
  Bell, 
  Palette,
  Database,
  Mail,
  Key,
  Save
} from "lucide-react";

export default function Settings() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Settings</h1>
          <p className="text-gray-600">Configure your CMS preferences and options</p>
        </div>
        <div className="flex items-center gap-4">
          <Button className="bg-hanok-teal hover:bg-hanok-teal/90 text-white">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Navigation */}
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Settings Menu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-50">
              <Globe className="mr-2 h-4 w-4" />
              General
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-50">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-50">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-50">
              <Palette className="mr-2 h-4 w-4" />
              Appearance
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-50">
              <Database className="mr-2 h-4 w-4" />
              Database
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-50">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription className="text-gray-600">
                Basic configuration for your CMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name" className="text-gray-700">Site Name</Label>
                  <Input
                    id="site-name"
                    defaultValue="ContentCMS"
                    className="bg-gray-50 border-gray-300 text-gray-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-url" className="text-gray-700">Site URL</Label>
                  <Input
                    id="site-url"
                    defaultValue="https://example.com"
                    className="bg-gray-50 border-gray-300 text-gray-800"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700">Site Description</Label>
                <Textarea
                  id="description"
                  defaultValue="A modern content management system"
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700">Maintenance Mode</Label>
                  <p className="text-sm text-gray-600">Put your site in maintenance mode</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-gray-600">
                Manage security and authentication options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-300">Enabled</Badge>
              </div>

              <Separator className="bg-gray-200" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700">Login Notifications</Label>
                  <p className="text-sm text-gray-600">Get notified when someone logs into your account</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout" className="text-gray-700">Session Timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  defaultValue="120"
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-gray-600">
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700">Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700">Push Notifications</Label>
                  <p className="text-sm text-gray-600">Receive push notifications in your browser</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700">Content Published</Label>
                  <p className="text-sm text-gray-600">Notify when content is published</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700">New Comments</Label>
                  <p className="text-sm text-gray-600">Notify when new comments are posted</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* API Settings */}
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Settings
              </CardTitle>
              <CardDescription className="text-gray-600">
                Manage API keys and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-gray-700">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value="sk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="bg-gray-50 border-gray-300 text-gray-800 font-mono"
                  />
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:text-gray-800 hover:bg-gray-50">
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-700">API Access</Label>
                  <p className="text-sm text-gray-600">Allow external applications to access your content</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url" className="text-gray-700">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  placeholder="https://your-app.com/webhook"
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
