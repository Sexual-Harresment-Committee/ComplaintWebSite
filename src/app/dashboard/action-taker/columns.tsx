"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Complaint } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

export const columns: ColumnDef<Complaint>[] = [
  {
    accessorKey: "complaintId",
    header: "ID",
    cell: ({ row }) => <div className="font-mono">{row.getValue("complaintId")}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
    },
    cell: ({ row }) => {
        const val = row.getValue("status") as string;
        return <Badge variant="outline">{val}</Badge>
    }
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => {
        const val = row.getValue("severity") as string;
        const color = val === 'Critical' ? 'text-red-600 font-bold' : val === 'High' ? 'text-orange-600' : 'text-neutral-600';
        return <span className={color}>{val}</span>
    }
  },
  {
    accessorKey: "createdAt",
    header: "Submitted",
    cell: ({ row }) => {
        const date = (row.getValue("createdAt") as any)?.toDate();
        return date ? format(date, "MMM d, yyyy") : "N/A";
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const complaint = row.original
 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(complaint.complaintId)}
            >
              Copy Complaint ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Details</DropdownMenuItem>
            {/* We will handle 'Edit' via opening a dialog or sheet in the main component */}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
