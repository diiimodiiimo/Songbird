// Add this utility function and modal to HistoryTab.tsx

// Edit People Modal Component
interface EditPeopleModalProps {
  isOpen: boolean
  onClose: () => void
  entry: Entry
  onSave: (entryId: string, people: string[]) => Promise<void>
}

function EditPeopleModal({ isOpen, onClose, entry, onSave }: EditPeopleModalProps) {
  const [peopleInput, setPeopleInput] = useState('')
  const [peopleList, setPeopleList] = useState<string[]>(
    entry.people?.map(p => p.name) || []
  )
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleAddPerson = () => {
    const trimmed = peopleInput.trim()
    if (trimmed && !peopleList.includes(trimmed)) {
      setPeopleList([...peopleList, trimmed])
      setPeopleInput('')
    }
  }

  const handleRemovePerson = (name: string) => {
    setPeopleList(peopleList.filter(p => p !== name))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(entry.id, peopleList)
      onClose()
    } catch (error) {
      console.error('Error saving people:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Edit People in Your Day</h3>
          <button onClick={onClose} className="text-text/60 hover:text-text text-2xl">×</button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-text/60">Song: {entry.songTitle}</p>
          <p className="text-sm text-text/60">Date: {entry.date.split('T')[0]}</p>
        </div>

        {/* Add Person Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={peopleInput}
            onChange={(e) => setPeopleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddPerson()
              }
            }}
            placeholder="Add person's name..."
            className="flex-1 px-3 py-2 bg-bg border border-surface rounded-lg text-text placeholder:text-text/40 focus:border-accent outline-none transition-colors"
          />
          <button
            onClick={handleAddPerson}
            className="px-4 py-2 bg-accent text-bg rounded-lg hover:bg-accent/90 transition-colors font-medium"
          >
            Add
          </button>
        </div>

        {/* People List */}
        {peopleList.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {peopleList.map((person) => (
              <div
                key={person}
                className="px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-full text-accent text-sm flex items-center gap-2"
              >
                {person}
                <button
                  onClick={() => handleRemovePerson(person)}
                  className="hover:text-accent/70 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text/60 text-center py-4">No people added yet</p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-bg border border-surface rounded-lg text-text hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-accent text-bg rounded-lg hover:bg-accent/90 transition-colors font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
