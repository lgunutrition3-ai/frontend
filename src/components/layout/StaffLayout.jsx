import { useEffect, useRef, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { StaffDataEntryProvider, useStaffDataEntry } from '../staff/StaffDataEntryContext'
import './css/StaffLayout.css'

const TAP_THRESHOLD = 8
const LONG_PRESS_MS = 450

const StaffLayout = () => (
  <StaffDataEntryProvider>
    <StaffLayoutContent />
  </StaffDataEntryProvider>
)

const StaffLayoutContent = () => {
  const { selectMode, setSelectMode } = useStaffDataEntry()
  const touchInfo = useRef({ startX: 0, startY: 0, scrolled: false, longPressed: false })
  const longPressTimer = useRef(null)
  const selectModeRef = useRef(false)
  const isTouch = useRef(false)

  useEffect(() => {
    selectModeRef.current = selectMode
  }, [selectMode])

  const handleLongPressSelect = useCallback((target) => {
    const row = target && target.closest('.record-table tbody tr')
    if (row) {
      const rowCheck = row.querySelector('.record-check-cell .form-check-input')
      if (rowCheck && !rowCheck.checked) {
        rowCheck.click()
      }
    }
    setSelectMode(true)
  }, [setSelectMode])

  useEffect(() => {
    isTouch.current = window.matchMedia('(hover: none) and (pointer: coarse)').matches

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return
      const target = e.target

      touchInfo.current.startX = e.touches[0].clientX
      touchInfo.current.startY = e.touches[0].clientY
      touchInfo.current.scrolled = false
      touchInfo.current.longPressed = false
      clearTimeout(longPressTimer.current)

      // Long-pressing a table row on a phone selects just that row
      if (target && target.closest('.record-table tbody tr')) {
        longPressTimer.current = setTimeout(() => {
          touchInfo.current.longPressed = true
          handleLongPressSelect(target)
        }, LONG_PRESS_MS)
      }
    }

    const handleTouchMove = (e) => {
      if (e.touches.length !== 1) return
      const dx = Math.abs(e.touches[0].clientX - touchInfo.current.startX)
      const dy = Math.abs(e.touches[0].clientY - touchInfo.current.startY)
      if (dx > TAP_THRESHOLD || dy > TAP_THRESHOLD) {
        touchInfo.current.scrolled = true
        clearTimeout(longPressTimer.current)
      }
    }

    const clearLongPress = () => {
      clearTimeout(longPressTimer.current)
    }

    const handleClick = (e) => {
      const target = e.target

      // Suppress ghost clicks that come from scrolling
      if (touchInfo.current.scrolled) {
        touchInfo.current.scrolled = false
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // A long-press already selected the row, so ignore the release click
      if (touchInfo.current.longPressed) {
        touchInfo.current.longPressed = false
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Phone only: outside selection mode, tapping a row must NOT toggle selection
      if (
        isTouch.current &&
        !selectModeRef.current &&
        target &&
        target.closest('.record-table tbody tr') &&
        !target.closest('button, a, input, label, select, textarea')
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', clearLongPress)
    document.addEventListener('touchcancel', clearLongPress)
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', clearLongPress)
      document.removeEventListener('touchcancel', clearLongPress)
      document.removeEventListener('click', handleClick, true)
      clearTimeout(longPressTimer.current)
    }
  }, [handleLongPressSelect])

  return (
    <div className={`staff-layout${selectMode ? ' record-select-mode' : ''}`}>
      <div className="content-area">
        <Outlet />
      </div>

      {selectMode && (
        <button type="button" className="staff-select-cancel" onClick={() => setSelectMode(false)}>
          <i className="bi bi-x-lg me-1"></i>
          Cancel
        </button>
      )}
    </div>
  )
}

export default StaffLayout
