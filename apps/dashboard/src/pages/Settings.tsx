
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Configure your CMS preferences and options</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Settings Menu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
              <Globe className="mr-2 h-4 w-4" />
              General
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
              <Palette className="mr-2 h-4 w-4" />
              Appearance
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
              <Database className="mr-2 h-4 w-4" />
              Database
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-700">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Basic configuration for your CMS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name" className="text-slate-300">Site Name</Label>
                  <Input
                    id="site-name"
                    defaultValue="ContentCMS"
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-url" className="text-slate-300">Site URL</Label>
                  <Input
                    id="site-url"
                    defaultValue="https://example.com"
                    className="bg-slate-900/50 border-slate-600 text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">Site Description</Label>
                <Textarea
                  id="description"
                  defaultValue="A modern content management system"
                  className="bg-slate-900/50 border-slate-600 text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">Maintenance Mode</Label>
                  <p className="text-sm text-slate-400">Put your site in maintenance mode</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage security and authentication options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">Two-Factor Authentication</Label>
                  <p className="text-sm text-slate-400">Add an extra layer of security to your account</p>
                </div>
                <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Enabled</Badge>
              </div>

              <Separator className="bg-slate-700" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">Login Notifications</Label>
                  <p className="text-sm text-slate-400">Get notified when someone logs into your account</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout" className="text-slate-300">Session Timeout (minutes)</Label>
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
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">Email Notifications</Label>
                  <p className="text-sm text-slate-400">Receive notifications via email</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">Push Notifications</Label>
                  <p className="text-sm text-slate-400">Receive push notifications in your browser</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">Content Published</Label>
                  <p className="text-sm text-slate-400">Notify when content is published</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">New Comments</Label>
                  <p className="text-sm text-slate-400">Notify when new comments are posted</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* API Settings */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage API keys and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value="sk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="bg-slate-900/50 border-slate-600 text-white font-mono"
                  />
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-300">API Access</Label>
                  <p className="text-sm text-slate-400">Allow external applications to access your content</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url" className="text-slate-300">Webhook URL</Label>
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
