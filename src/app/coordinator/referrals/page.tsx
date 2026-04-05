'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Row = {
  id: string;
  firstName: string;
  lastName: string;
  parentName: string;
  parentEmail: string;
  enrollmentStatus: string;
  approvalStatus: string | null;
  assessmentStatus: string | null;
  createdAt: string;
};

const SORT_OPTIONS = [
  { value: 'first_name', label: 'First name' },
  { value: 'last_name', label: 'Last name' },
  { value: 'enrollment_status', label: 'Enrollment' },
  { value: 'approval_status', label: 'Approval' },
  { value: 'assessment_status', label: 'Assessment' },
  { value: 'created_at', label: 'Created' },
] as const;

export default function CoordinatorReferralsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('first_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [adminCoordinatorId, setAdminCoordinatorId] = useState('');

  const isAdmin = role === 'admin';

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchRows = useCallback(async () => {
    if (!user) return;
    if (isAdmin && !adminCoordinatorId.trim()) {
      setRows([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });
      if (search) params.set('search', search);
      if (isAdmin) params.set('coordinator_id', adminCoordinatorId.trim());

      const res = await fetch(`/api/coordinator/swimmers?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to load swimmers');
      }
      setRows(json.data || []);
      setTotal(json.total ?? 0);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Could not load swimmers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, search, sortBy, sortOrder, isAdmin, adminCoordinatorId, toast]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const sortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="inline h-4 w-4" />
    ) : (
      <ChevronDown className="inline h-4 w-4" />
    );
  };

  const handleDecision = async (swimmerId: string, approval_status: 'approved' | 'declined') => {
    setActionId(swimmerId);
    try {
      const res = await fetch(`/api/coordinator/swimmers/${swimmerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Update failed');
      }
      toast({
        title: approval_status === 'approved' ? 'Approved' : 'Rejected',
        description:
          approval_status === 'declined'
            ? 'The parent will be notified by email.'
            : 'Swimmer enrollment has been updated.',
      });
      await fetchRows();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Update failed',
        variant: 'destructive',
      });
    } finally {
      setActionId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Referrals & approvals</h1>
        <p className="text-muted-foreground mt-1">
          Swimmers assigned to you as coordinator. Approve or reject enrollment requests.
        </p>
      </div>

      {isAdmin && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <p className="text-sm font-medium">Admin: view a coordinator&apos;s roster</p>
          <Input
            placeholder="Coordinator profile UUID"
            value={adminCoordinatorId}
            onChange={(e) => {
              setAdminCoordinatorId(e.target.value);
              setPage(1);
            }}
            className="max-w-xl font-mono text-sm"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search first name, last name, parent email…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            className="pl-9"
            disabled={isAdmin && !adminCoordinatorId.trim()}
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by</span>
          <Select
            value={sortBy}
            onValueChange={(v) => {
              setSortBy(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
          >
            {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : isAdmin && !adminCoordinatorId.trim() ? (
        <p className="text-center text-muted-foreground py-12">
          Enter a coordinator UUID above to load swimmers.
        </p>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort('first_name')}
                  >
                    First name {sortIcon('first_name')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort('last_name')}
                  >
                    Last name {sortIcon('last_name')}
                  </TableHead>
                  <TableHead>Parent name</TableHead>
                  <TableHead>Parent email</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort('enrollment_status')}
                  >
                    Enrollment {sortIcon('enrollment_status')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort('approval_status')}
                  >
                    Approval {sortIcon('approval_status')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort('assessment_status')}
                  >
                    Assessment {sortIcon('assessment_status')}
                  </TableHead>
                  <TableHead className="w-[120px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                      No swimmers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.firstName}</TableCell>
                      <TableCell>{r.lastName}</TableCell>
                      <TableCell>{r.parentName || '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={r.parentEmail}>
                        {r.parentEmail || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.enrollmentStatus || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.approvalStatus || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.assessmentStatus || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={actionId === r.id}
                              aria-label="Actions"
                            >
                              {actionId === r.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDecision(r.id, 'approved')}
                              disabled={r.approvalStatus === 'approved'}
                            >
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDecision(r.id, 'declined')}
                              disabled={r.approvalStatus === 'declined'}
                              className="text-destructive focus:text-destructive"
                            >
                              Reject
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {rows.length} of {total} swimmers
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
