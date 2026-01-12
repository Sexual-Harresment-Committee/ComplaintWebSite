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
    cell: ({ row }) => <div className="font-mono text-teal-400">{row.getValue("complaintId")}</div>,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <div className="text-white">{row.getValue("category")}</div>,
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => {
        const val = row.getValue("severity") as string;
        let className = "px-2 py-0.5 rounded text-xs font-medium border ";
        if (val === 'Critical') className += 'border-red-500 text-red-400 bg-red-500/10';
        else if (val === 'High') className += 'border-orange-500 text-orange-400 bg-orange-500/10';
        else className += 'border-gray-500 text-gray-400';
        
        return <span className={className}>{val}</span>
    }
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="text-gray-300 hover:text-white pl-0"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
    },
    cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let className = "";
        switch (status) {
            case 'Submitted': className = 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'; break;
            case 'Viewed': className = 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'; break;
            case 'Under Review': className = 'bg-blue-500/10 text-blue-500 border-blue-500/20'; break;
            case 'Working': className = 'bg-orange-500/10 text-orange-500 border-orange-500/20'; break;
            case 'Investigation': className = 'bg-purple-500/10 text-purple-500 border-purple-500/20'; break;
            case 'Resolved': className = 'bg-green-500/10 text-green-500 border-green-500/20'; break;
            case 'Dismissed': className = 'bg-red-500/10 text-red-500 border-red-500/20'; break;
            default: className = 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
        return <Badge variant="outline" className={className}>{status}</Badge>
    }
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    cell: () => <div className="text-gray-300 italic">Me</div>,
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
        const date = (row.getValue("createdAt") as any)?.toDate();
        return <div className="text-gray-400 text-sm">{date ? format(date, "MMM d, yyyy") : "N/A"}</div>;
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right">
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
        </div>
      )
    },
  },
]
