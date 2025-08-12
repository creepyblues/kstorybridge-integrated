import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@kstorybridge/ui";

import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail,
  Shield,
  Calendar,
  UserCheck
} from "lucide-react";

const usersData = [
  {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Admin",
    status: "Active",
    avatar: "/placeholder.svg",
    joinDate: "2024-01-15",
    lastActive: "2 hours ago",
    articlesCount: 24
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Editor",
    status: "Active",
    avatar: "/placeholder.svg",
    joinDate: "2024-01-10",
    lastActive: "1 day ago",
    articlesCount: 18
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    role: "Author",
    status: "Active",
    avatar: "/placeholder.svg",
    joinDate: "2024-01-05",
    lastActive: "3 hours ago",
    articlesCount: 12
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    role: "Author",
    status: "Inactive",
    avatar: "/placeholder.svg",
    joinDate: "2023-12-20",
    lastActive: "1 week ago",
    articlesCount: 8
  },
  {
    id: 5,
    name: "Alex Brown",
    email: "alex.brown@example.com",
    role: "Editor",
    status: "Active",
    avatar: "/placeholder.svg",
    joinDate: "2023-12-15",
    lastActive: "5 hours ago",
    articlesCount: 15
  },
];

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = usersData.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role.toLowerCase() === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "Admin":
        return <Badge className="bg-red-600/20 text-red-400 border-red-600/30">Admin</Badge>;
      case "Editor":
        return <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">Editor</Badge>;
      case "Author":
        return <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Author</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "Active" 
      ? <Badge className="bg-green-600/20 text-green-400 border-green-600/30">Active</Badge>
      : <Badge className="bg-slate-600/20 text-slate-400 border-slate-600/30">Inactive</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-slate-400">Manage user accounts, roles, and permissions</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Users</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{usersData.length}</div>
            <p className="text-xs text-green-400">+2 this week</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {usersData.filter(u => u.status === "Active").length}
            </div>
            <p className="text-xs text-green-400">89% active rate</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {usersData.filter(u => u.role === "Admin").length}
            </div>
            <p className="text-xs text-slate-400">Super users</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Authors</CardTitle>
            <Edit className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {usersData.filter(u => u.role === "Author").length}
            </div>
            <p className="text-xs text-purple-400">Content creators</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">All Users</CardTitle>
          <CardDescription className="text-slate-400">
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
                  <Filter className="mr-2 h-4 w-4" />
                  Role: {roleFilter === "all" ? "All" : roleFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem 
                  onClick={() => setRoleFilter("all")}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  All Roles
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setRoleFilter("admin")}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  Admin
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setRoleFilter("editor")}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  Editor
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setRoleFilter("author")}
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                >
                  Author
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Users Table */}
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-900/50">
                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                  <TableHead className="text-slate-300">User</TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Articles</TableHead>
                  <TableHead className="text-slate-300">Last Active</TableHead>
                  <TableHead className="text-slate-300">Join Date</TableHead>
                  <TableHead className="text-slate-300 w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-700 hover:bg-slate-800/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-slate-700 text-white">
                            {user.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-white">{user.name}</div>
                          <div className="text-sm text-slate-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-slate-300">{user.articlesCount}</TableCell>
                    <TableCell className="text-slate-400">{user.lastActive}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar className="h-4 w-4" />
                        {user.joinDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                            <Shield className="mr-2 h-4 w-4" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-slate-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
