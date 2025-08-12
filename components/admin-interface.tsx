"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit, Plus, Save, X } from "lucide-react"

interface Trick {
  name: string
  definition: string
}

interface AdminInterfaceProps {
  tricks: Trick[]
  onAddTrick: (name: string, definition: string) => void
  onRemoveTrick: (index: number) => void
  onUpdateTrick: (index: number, name: string, definition: string) => void
}

export function AdminInterface({ tricks, onAddTrick, onRemoveTrick, onUpdateTrick }: AdminInterfaceProps) {
  const [newTrickName, setNewTrickName] = useState("")
  const [newTrickDefinition, setNewTrickDefinition] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDefinition, setEditDefinition] = useState("")

  const handleAddTrick = () => {
    if (newTrickName.trim() && newTrickDefinition.trim()) {
      onAddTrick(newTrickName.trim(), newTrickDefinition.trim())
      setNewTrickName("")
      setNewTrickDefinition("")
    }
  }

  const startEditing = (index: number) => {
    setEditingIndex(index)
    setEditName(tricks[index].name)
    setEditDefinition(tricks[index].definition)
  }

  const saveEdit = () => {
    if (editingIndex !== null && editName.trim() && editDefinition.trim()) {
      onUpdateTrick(editingIndex, editName.trim(), editDefinition.trim())
      setEditingIndex(null)
      setEditName("")
      setEditDefinition("")
    }
  }

  const cancelEdit = () => {
    setEditingIndex(null)
    setEditName("")
    setEditDefinition("")
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">DJ Trick Manager</h1>

        {/* Add New Trick */}
        <Card className="mb-8 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Trick
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Trick name (e.g., 'Filter Sweep')"
              value={newTrickName}
              onChange={(e) => setNewTrickName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white"
            />
            <Textarea
              placeholder="Trick definition (e.g., 'Use high/low pass filters to create sweeping transition effects')"
              value={newTrickDefinition}
              onChange={(e) => setNewTrickDefinition(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white min-h-20"
            />
            <Button onClick={handleAddTrick} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Trick
            </Button>
          </CardContent>
        </Card>

        {/* Tricks List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tricks.map((trick, index) => (
            <Card key={index} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                {editingIndex === index ? (
                  <div className="space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Textarea
                      value={editDefinition}
                      onChange={(e) => setEditDefinition(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white min-h-20"
                    />
                    <div className="flex gap-2">
                      <Button onClick={saveEdit} size="sm" className="bg-green-600 hover:bg-green-700">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button onClick={cancelEdit} size="sm" variant="outline">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-bold text-white mb-2">{trick.name}</h3>
                    <p className="text-gray-300 text-sm mb-4">{trick.definition}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => startEditing(index)}
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => onRemoveTrick(index)} size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-gray-400">
          <p>Total Tricks: {tricks.length}</p>
          <p className="text-sm mt-2">Use Ctrl+S to simulate !spin command | Ctrl+H to simulate !hidespin command</p>
        </div>
      </div>
    </div>
  )
}
