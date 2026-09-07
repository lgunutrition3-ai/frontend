import { createContext, useContext, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

const StaffDataEntryContext = createContext(null)

export const StaffDataEntryProvider = ({ children }) => {
  const { user } = useAuth()
  const [selectedBarangay, setSelectedBarangay] = useState(user?.barangay || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().split('T')[0])
  const [purok, setPurok] = useState('')
  const [name, setName] = useState('')
  const [selectMode, setSelectMode] = useState(false)

  return (
    <StaffDataEntryContext.Provider
      value={{
        selectedBarangay,
        setSelectedBarangay,
        searchTerm,
        setSearchTerm,
        recordDate,
        setRecordDate,
        purok,
        setPurok,
        name,
        setName,
        selectMode,
        setSelectMode,
      }}
    >
      {children}
    </StaffDataEntryContext.Provider>
  )
}

export const useStaffDataEntry = () => {
  const context = useContext(StaffDataEntryContext)
  if (!context) throw new Error('useStaffDataEntry must be used within a StaffDataEntryProvider')
  return context
}