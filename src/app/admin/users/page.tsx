
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { 
  Users, 
  Search, 
  MoreVertical,
  UserCheck,
  UserX,
  Shield,
  GraduationCap,
  Trash2,
  Edit
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/types';

const StatCard = ({ title, value, color }: { title: string, value: number, color?: string }) => (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`text-2xl font-bold ${color || 'text-foreground'}`}>{value}</p>
      </CardContent>
    </Card>
);

const ManageUsersPage = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch users.' });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.rollNo?.toLowerCase().includes(term)
      );
    }
    if (filterRole !== 'all') filtered = filtered.filter(user => user.role === filterRole);
    if (filterStatus !== 'all') filtered = filtered.filter(user => user.status === filterStatus);
    setFilteredUsers(filtered);
  };
  
  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await updateDoc(doc(db, 'users', selectedUser.uid), { role: newRole });
      await fetchUsers();
      toast({ title: 'Success', description: 'User role updated successfully.' });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user role.' });
    } finally {
      setShowRoleModal(false);
      setSelectedUser(null);
    }
  };

  const handleUpdateStatus = async (userId: string, status: 'active' | 'suspended') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status });
      await fetchUsers();
      toast({ title: 'Success', description: `User status updated to ${status}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user status.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
     if (!confirm('Are you sure you want to delete this user? This action is irreversible.')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      await fetchUsers();
      toast({ title: 'Success', description: 'User deleted successfully.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete user.' });
    }
  };


  const formatDate = (date: any) => {
    if (!date?.toDate) return 'N/A';
    return date.toDate().toLocaleDateString('en-IN');
  };

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <Shield className="h-4 w-4" />;
    if (role === 'organizer') return <UserCheck className="h-4 w-4" />;
    return <GraduationCap className="h-4 w-4" />;
  };
  
   const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'organizer': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'suspended': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const stats = {
    total: users.length,
    students: users.filter(u => u.role === 'student').length,
    organizers: users.filter(u => u.role === 'organizer').length,
    admins: users.filter(u => u.role === 'admin').length,
    pending: users.filter(u => u.status === 'pending').length
  };

  return (
    <div className="space-y-6">
       <div>
        <h1 className="font-headline text-3xl font-bold text-foreground md:text-4xl">
          Manage Users
        </h1>
        <p className="text-muted-foreground">
          View, edit, and manage all user accounts on the platform.
        </p>
      </div>

       <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total Users" value={stats.total} />
        <StatCard title="Students" value={stats.students} color="text-green-600" />
        <StatCard title="Organizers" value={stats.organizers} color="text-blue-600" />
        <StatCard title="Admins" value={stats.admins} color="text-purple-600" />
        <StatCard title="Pending" value={stats.pending} color="text-yellow-600" />
      </div>

       <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, email, roll no..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <Select value={filterRole} onValueChange={setFilterRole}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="organizer">Organizer</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                         <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No users match your criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                <TableRow key={user.uid}>
                                    <TableCell>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-sm text-muted-foreground">{user.rollNo}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{user.email}</div>
                                        <div className="text-sm text-muted-foreground">{user.phone}</div>
                                    </TableCell>
                                    <TableCell><Badge className={getRoleBadgeClass(user.role)}>{getRoleIcon(user.role)}<span className="ml-1.5">{user.role}</span></Badge></TableCell>
                                    <TableCell><Badge className={getStatusBadgeClass(user.status)}>{user.status}</Badge></TableCell>
                                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => { setSelectedUser(user); setNewRole(user.role); setShowRoleModal(true); }}>
                                                    <Edit className="mr-2 h-4 w-4" /> Change Role
                                                </DropdownMenuItem>
                                                {user.status === 'active' ? (
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(user.uid, 'suspended')}>
                                                        <UserX className="mr-2 h-4 w-4" /> Suspend
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(user.uid, 'active')}>
                                                        <UserCheck className="mr-2 h-4 w-4" /> Activate
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleDeleteUser(user.uid)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      
       <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role for {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Select the new role for this user. This will affect their permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="organizer">Organizer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRoleModal(false)}>Cancel</Button>
            <Button onClick={handleChangeRole} disabled={!newRole || newRole === selectedUser?.role}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageUsersPage;
