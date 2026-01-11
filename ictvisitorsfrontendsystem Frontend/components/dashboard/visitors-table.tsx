"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, FileSpreadsheet, FileText, Pencil, Trash2, QrCode, User } from "lucide-react"
import { toast } from "sonner"
import { VisitorModal } from "@/components/visitor-modal"
import { QRGenerator } from "@/components/qr-generator"
import { Dialog, DialogContent } from "@/components/ui/dialog"


const API_BASE_URL = "https://localhost:7099/api"

interface ApiVisitor {
  id: number
  full_Name: string
  program: string
  student_Year: string
  purpose: string
  visiteDate: string
  time_in: string
  time_out: string
  visitToken?: string
  photo?: string
  department?: string
}

// Shape used by the table UI
interface Visitor {
  id: number
  fullName: string
  program: string
  year: string
  purpose: string
  date: string
  timeIn: string
  timeOut: string
  visitToken?: string
  photo?: string
  department: string
}

const mapFromApi = (v: ApiVisitor): Visitor => ({
  id: v.id,
  fullName: v.full_Name,
  program: v.program,
  year: v.student_Year,
  purpose: v.purpose,
  date: v.visiteDate.split("T")[0],
  timeIn: v.time_in,
  // Treat "00:00:00" (no time out recorded) as empty so UI shows "Active"
  timeOut: !v.time_out || v.time_out.startsWith("00:00:00") ? "" : v.time_out,
  visitToken: v.visitToken || `VISIT-${v.id}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, // Fallback if backend null
  photo: v.photo || (v as any).Photo,
  department: v.department || ""
})

const toTimeSpanString = (value: string): string => {
  if (!value) return "00:00:00"
  // from HTML time input we usually get "HH:mm"
  if (value.length === 5) return `${value}:00`
  return value
}

const mapToApi = (v: Visitor): ApiVisitor => ({
  id: v.id,
  full_Name: v.fullName,
  program: v.program,
  student_Year: v.year,
  purpose: v.purpose,
  visiteDate: v.date,
  time_in: toTimeSpanString(v.timeIn),
  time_out: toTimeSpanString(v.timeOut),
  photo: v.photo,
  department: v.department
})

export function VisitorsTable() {
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [searchName, setSearchName] = useState("")
  const [searchDate, setSearchDate] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null)
  const [qrVisitor, setQrVisitor] = useState<Visitor | null>(null)

  // Load visitors from backend
  useEffect(() => {
    const loadVisitors = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/visitors`)
        if (!res.ok) throw new Error("Failed to load visitors")
        const data: ApiVisitor[] = await res.json()
        setVisitors(data.map(mapFromApi))
      } catch (err) {
        console.error(err)
        toast.error("Failed to load visitors from server")
      }
    }
    loadVisitors()
  }, [])

  const filteredVisitors = visitors.filter((visitor) => {
    const matchesName = visitor.fullName.toLowerCase().includes(searchName.toLowerCase())
    const matchesDate = !searchDate || visitor.date === searchDate
    return matchesName && matchesDate
  })

  const handleAddVisitor = async (data: Omit<Visitor, "id">) => {
    try {
      const payload = mapToApi({ ...data, id: 0 })
      const res = await fetch(`${API_BASE_URL}/visitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to add visitor")
      const created: ApiVisitor = await res.json()
      setVisitors((prev) => [...prev, mapFromApi(created)])
      toast.success("Visitor added successfully")
    } catch (err) {
      console.error(err)
      toast.error("Error adding visitor")
    }
  }

  const handleEditVisitor = async (data: Omit<Visitor, "id">) => {
    if (!editingVisitor) return
    try {
      const updated: Visitor = { ...data, id: editingVisitor.id }
      const payload = mapToApi(updated)
      const res = await fetch(`${API_BASE_URL}/visitors/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to update visitor")
      setVisitors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
      toast.success("Visitor updated successfully")
      setEditingVisitor(null)
    } catch (err) {
      console.error(err)
      toast.error("Error updating visitor")
    }
  }

  const handleDeleteVisitor = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/visitors/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete visitor")
      setVisitors((prev) => prev.filter((v) => v.id !== id))
      toast.success("Visitor deleted")
    } catch (err) {
      console.error(err)
      toast.error("Error deleting visitor")
    }
  }

  const exportToExcel = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const XLSX = await import("xlsx")

      // Prepare data for Excel
      const excelData = filteredVisitors.map((visitor) => ({
        Name: visitor.fullName,
        Program: visitor.program,
        Year: visitor.year,
        Purpose: visitor.purpose,
        Date: visitor.date,
        "Time In": visitor.timeIn || "-",
        "Time Out": visitor.timeOut || "Active",
      }))

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData)

      // Set column widths for better readability
      const columnWidths = [
        { wch: 25 }, // Name
        { wch: 30 }, // Program
        { wch: 15 }, // Year
        { wch: 30 }, // Purpose
        { wch: 12 }, // Date
        { wch: 12 }, // Time In
        { wch: 12 }, // Time Out
      ]
      worksheet["!cols"] = columnWidths

      // Style header row (first row)
      const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1")
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
        if (!worksheet[cellAddress]) continue

        // Make header row bold (we can't directly style in xlsx, but we can set the cell value format)
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "428BCA" } },
          alignment: { horizontal: "center", vertical: "center" },
        }
      }

      // Create workbook
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Visitors")

      // Generate filename with current date
      const fileName = `Visitors_Report_${new Date().toISOString().split("T")[0]}.xlsx`

      // Write file
      XLSX.writeFile(workbook, fileName)
      toast.success("Excel file exported successfully")
    } catch (err) {
      console.error("Excel export error:", err)
      toast.error("Failed to export Excel file. Please try again.")
    }
  }

  const exportToPDF = async () => {
    try {
      // Import both modules
      const [{ default: jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ])

      // jspdf-autotable v5 extends jsPDF automatically when imported
      // But we need to ensure it's loaded before using
      const doc = new jsPDF("landscape", "mm", "a4")

      // Verify autoTable is available
      if (!(doc as any).autoTable) {
        // Force load by accessing the module
        ; (autoTableModule as any)
        // Try again after a brief delay
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Header with styling
      doc.setFillColor(66, 139, 202)
      doc.rect(0, 0, pageWidth, 25, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.text("ICT Visitors Management System", pageWidth / 2, 12, { align: "center" })

      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text(`Visitor Report - ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })}`, pageWidth / 2, 19, {
        align: "center",
      })

      // Reset text color
      doc.setTextColor(0, 0, 0)

      // Prepare table data from filtered visitors
      const tableData = filteredVisitors.map((visitor) => [
        visitor.fullName,
        visitor.program,
        visitor.year,
        visitor.purpose,
        visitor.date,
        visitor.timeIn || "-",
        visitor.timeOut || "Active",
      ])

      let finalY = pageHeight - 20

      // Use autoTable method
      if (typeof (doc as any).autoTable === "function") {
        ; (doc as any).autoTable({
          head: [["Name", "Program", "Year", "Purpose", "Date", "Time In", "Time Out"]],
          body: tableData,
          startY: 32,
          styles: {
            fontSize: 9,
            cellPadding: 4,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            textColor: [50, 50, 50],
          },
          headStyles: {
            fillColor: [66, 139, 202],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 10,
            cellPadding: 5,
          },
          bodyStyles: {
            cellPadding: 4,
            fontSize: 9,
          },
          alternateRowStyles: {
            fillColor: [250, 250, 250],
          },
          margin: { top: 32, left: 12, right: 12 },
          theme: "striped",
          tableWidth: "auto",
          columnStyles: {
            0: { cellWidth: 50 }, // Name
            1: { cellWidth: 45 }, // Program
            2: { cellWidth: 30 }, // Year
            3: { cellWidth: 50 }, // Purpose
            4: { cellWidth: 35 }, // Date
            5: { cellWidth: 30 }, // Time In
            6: { cellWidth: 30 }, // Time Out
          },
        })
        finalY = (doc as any).lastAutoTable?.finalY || finalY
      } else {
        // Fallback: create styled PDF without autoTable
        let yPos = 32
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")

        // Headers
        const headers = ["Name", "Program", "Year", "Purpose", "Date", "Time In", "Time Out"]
        const colWidths = [50, 45, 30, 50, 35, 30, 30]
        const startX = 12
        let xPos = startX

        // Draw header row with styled background
        headers.forEach((header, i) => {
          // Draw header background rectangle
          doc.setFillColor(66, 139, 202)
          doc.rect(xPos, yPos - 8, colWidths[i], 8, "F")
          // Draw header text (white, centered)
          doc.setTextColor(255, 255, 255)
          doc.text(header, xPos + colWidths[i] / 2, yPos - 3, { align: "center" })
          xPos += colWidths[i]
        })

        yPos += 2
        doc.setTextColor(50, 50, 50)
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)

        // Data rows with styling
        tableData.forEach((row, rowIndex) => {
          // Check if we need a new page
          if (yPos > pageHeight - 35) {
            doc.addPage()
            // Redraw header on new page
            yPos = 32
            xPos = startX
            doc.setFontSize(10)
            doc.setFont("helvetica", "bold")
            headers.forEach((header, i) => {
              doc.setFillColor(66, 139, 202)
              doc.rect(xPos, yPos - 8, colWidths[i], 8, "F")
              doc.setTextColor(255, 255, 255)
              doc.text(header, xPos + colWidths[i] / 2, yPos - 3, { align: "center" })
              xPos += colWidths[i]
            })
            yPos += 2
            doc.setTextColor(50, 50, 50)
            doc.setFont("helvetica", "normal")
            doc.setFontSize(9)
          }

          xPos = startX

          // Alternate row background for readability
          if (rowIndex % 2 === 0) {
            doc.setFillColor(250, 250, 250)
            doc.rect(xPos, yPos - 7, colWidths.reduce((a, b) => a + b, 0), 7, "F")
          } else {
            doc.setFillColor(255, 255, 255)
            doc.rect(xPos, yPos - 7, colWidths.reduce((a, b) => a + b, 0), 7, "F")
          }

          // Draw cell borders and text
          row.forEach((cell, i) => {
            // Draw cell border (subtle gray)
            doc.setDrawColor(220, 220, 220)
            doc.setLineWidth(0.1)
            doc.rect(xPos, yPos - 7, colWidths[i], 7, "S")

            // Draw cell text (dark gray, left-aligned with padding)
            doc.setTextColor(50, 50, 50)
            const cellText = String(cell || "").substring(0, 28) // Truncate long text
            if (cellText) {
              doc.text(cellText, xPos + 4, yPos - 2)
            }
            xPos += colWidths[i]
          })

          yPos += 8
        })
        finalY = yPos
      }

      // Footer with styling
      const footerY = finalY + 8
      doc.setFillColor(245, 245, 245)
      doc.rect(0, footerY, pageWidth, pageHeight - footerY, "F")

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)

      // Left side: Total count
      doc.text(`Total Visitors: ${filteredVisitors.length}`, 12, footerY + 5)

      // Right side: Generated date/time
      doc.text(
        `Generated: ${new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        pageWidth - 12,
        footerY + 5,
        { align: "right" },
      )

      // Center: Page number (if multiple pages)
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: "center" })
      }

      // Save PDF
      const fileName = `Visitors_Report_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)
      toast.success("PDF exported successfully")
    } catch (err) {
      console.error("PDF export error:", err)
      toast.error("Failed to export PDF. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visitors Table</h1>
          <p className="text-muted-foreground">Manage and track all visitor records</p>
        </div>
        <Button
          onClick={() => {
            setEditingVisitor(null)
            setModalOpen(true)
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Visitor
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="bg-input border-border pl-10 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-auto bg-input border-border text-foreground"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="border-border text-foreground hover:bg-secondary bg-transparent"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="border-border text-foreground hover:bg-secondary bg-transparent"
              >
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground w-[50px]">Photo</TableHead>
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Program</TableHead>
                  <TableHead className="text-muted-foreground">Year</TableHead>
                  <TableHead className="text-muted-foreground">Purpose</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Time In</TableHead>
                  <TableHead className="text-muted-foreground">Time Out</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisitors.map((visitor) => (
                  <TableRow key={visitor.id} className="border-border hover:bg-secondary/50">
                    <TableCell>
                      {visitor.photo ? (
                        <div className="h-10 w-10 rounded-full overflow-hidden border border-border shadow-sm">
                          <img src={visitor.photo} alt={visitor.fullName} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center border border-border">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{visitor.fullName}</TableCell>
                    <TableCell className="text-foreground">{visitor.program}</TableCell>
                    <TableCell className="text-foreground">{visitor.year}</TableCell>
                    <TableCell className="text-foreground">{visitor.purpose}</TableCell>
                    <TableCell className="text-foreground">{visitor.date}</TableCell>
                    <TableCell className="text-foreground">{visitor.timeIn}</TableCell>
                    <TableCell className="text-foreground">
                      {visitor.timeOut || (
                        <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingVisitor(visitor)
                            setModalOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteVisitor(visitor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => setQrVisitor(visitor)}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredVisitors.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No visitors found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!qrVisitor} onOpenChange={(open) => !open && setQrVisitor(null)}>
        <DialogContent className="sm:max-w-fit bg-transparent border-none shadow-none p-0">
          {qrVisitor && (
            <QRGenerator
              value={JSON.stringify({
                id: qrVisitor.id,
                name: qrVisitor.fullName,
                token: qrVisitor.visitToken
              })}
              visitorName={qrVisitor.fullName}
            />
          )}
        </DialogContent>
      </Dialog>

      <VisitorModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingVisitor(null)
        }}
        onSubmit={editingVisitor ? handleEditVisitor : handleAddVisitor}
        visitor={editingVisitor}
      />
    </div>
  )
}
