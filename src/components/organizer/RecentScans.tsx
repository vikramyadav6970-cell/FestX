'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { UserCheck, UserX, AlertTriangle, ScanSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Scan {
    id: string;
    name: string;
    time: string;
    status: 'success' | 'warning' | 'error';
}

interface RecentScansProps {
    scans: Scan[];
}

const statusInfo = {
    success: { icon: UserCheck, color: 'text-green-500' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500' },
    error: { icon: UserX, color: 'text-red-500' },
}

export function RecentScans({ scans }: RecentScansProps) {

    if (!scans || scans.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Scans</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center h-48">
                    <ScanSearch className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">No scans yet. Start scanning to see activity here.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64">
                    <div className="space-y-4">
                        {scans.map((scan) => {
                            const { icon: Icon, color } = statusInfo[scan.status];
                            return (
                                <div key={scan.id} className="flex items-center">
                                    <Icon className={cn("h-5 w-5 mr-4", color)} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium leading-none">{scan.name}</p>
                                        <p className="text-xs text-muted-foreground">{scan.time}</p>
                                    </div>
                                    <Badge variant={scan.status === 'success' ? 'default' : scan.status === 'warning' ? 'secondary' : 'destructive' } className="capitalize">
                                        {scan.status}
                                    </Badge>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
