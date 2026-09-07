import { useState, useEffect, useRef } from 'react'
import { Form } from 'react-bootstrap'
import './css/NameSuggestionField.css'

const NameSuggestionField = ({ label, value, onChange, placeholder = '', suggestions = [], required = false }) => {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState([])
  const wrapperRef = useRef(null)

  const getMatches = (query) => {
    const q = (query || '').trim().toLowerCase()
    if (!q) return []
    const uniqueNames = [...new Set(suggestions.filter(Boolean))]
    return uniqueNames
      .filter((name) => name.toLowerCase().includes(q))
      .slice(0, 8)
  }

  const isExactMatch = (query) => {
    const q = (query || '').trim().toLowerCase()
    if (!q) return false
    return getMatches(q).some((name) => name.toLowerCase() === q)
  }

  useEffect(() => {
    if (value.trim()) {
      const matches = getMatches(value)
      setFiltered(matches)
      setOpen(matches.length > 0 && !isExactMatch(value))
    } else {
      setFiltered([])
      setOpen(false)
    }
  }, [value, suggestions])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (name) => {
    onChange(name)
    setOpen(false)
  }

  return (
    <Form.Group className="mb-3 position-relative name-suggestion-field" ref={wrapperRef}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => value.trim() && !isExactMatch(value) && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="name-suggestion-dropdown">
          {filtered.map((name, index) => (
            <button
              type="button"
              key={`${name}-${index}`}
              className="name-suggestion-item"
              onClick={() => handleSelect(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </Form.Group>
  )
}

export default NameSuggestionField