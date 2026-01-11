"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface Visitor {
  id: number
  fullName: string
  program: string
  year: string
  purpose: string
  department: string
  date: string
  timeIn: string
  timeOut: string
}

interface VisitorModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<Visitor, "id">) => void
  visitor?: Visitor | null
}

export function VisitorModal({ open, onClose, onSubmit, visitor }: VisitorModalProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    program: "",
    year: "",
    purpose: "",
    department: "",
    date: "",
    timeIn: "",
    timeOut: "",
  })

  const [departments, setDepartments] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const token = localStorage.getItem("token")
        const headers = { "Authorization": `Bearer ${token}` }

        const [deptRes, progRes] = await Promise.all([
          fetch(`${API_BASE_URL}/departments`, { headers }),
          fetch(`${API_BASE_URL}/programs`, { headers })
        ])

        if (deptRes.ok) setDepartments(await deptRes.json())
        if (progRes.ok) setPrograms(await progRes.json())
      } catch (err) {
        console.error("Failed to fetch lists", err)
      }
    }
    fetchLists()
  }, [])

  useEffect(() => {
    if (visitor) {
      setFormData({
        fullName: visitor.fullName,
        program: visitor.program,
        year: visitor.year,
        purpose: visitor.purpose,
        department: visitor.department || "",
        date: visitor.date,
        timeIn: visitor.timeIn,
        timeOut: visitor.timeOut,
      })
    } else {
      setFormData({
        fullName: "",
        program: "",
        year: "",
        purpose: "",
        department: "",
        date: new Date().toISOString().split("T")[0],
        timeIn: "",
        timeOut: "",
      })
    }
  }, [visitor, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">{visitor ? "Edit Visitor" : "Add New Visitor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-foreground">
              Full Name
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="bg-input border-border text-foreground"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program" className="text-foreground">
                Program
              </Label>
              <Select
                value={formData.program}
                onValueChange={(val) => setFormData({ ...formData, program: val })}
              >
                <SelectTrigger className="bg-input border-border text-foreground">
                  <SelectValue placeholder="Select Program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map(p => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year" className="text-foreground">
                Year
              </Label>
              <Input
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="bg-input border-border text-foreground"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department" className="text-foreground">
              Department
            </Label>
            <Select
              value={formData.department}
              onValueChange={(val) => setFormData({ ...formData, department: val })}
            >
              <SelectTrigger className="bg-input border-border text-foreground">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(d => (
                  <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose" className="text-foreground">
              Purpose
            </Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="bg-input border-border text-foreground"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date" className="text-foreground">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-input border-border text-foreground"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeIn" className="text-foreground">
                Time In
              </Label>
              <Input
                id="timeIn"
                type="time"
                value={formData.timeIn}
                onChange={(e) => setFormData({ ...formData, timeIn: e.target.value })}
                className="bg-input border-border text-foreground"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeOut" className="text-foreground">
                Time Out
              </Label>
              <Input
                id="timeOut"
                type="time"
                value={formData.timeOut}
                onChange={(e) => setFormData({ ...formData, timeOut: e.target.value })}
                className="bg-input border-border text-foreground"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border text-foreground hover:bg-secondary bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              {visitor ? "Update" : "Add"} Visitor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
