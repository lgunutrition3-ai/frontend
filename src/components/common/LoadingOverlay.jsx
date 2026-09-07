import nutritionLogo from '../../assets/nutritionlogo.jpg'
import './css/LoadingOverlay.css'

const LoadingOverlay = ({ show, message = 'Please wait...' }) => {
  if (!show) return null

  return (
    <div className="loading-overlay">
      <div className="loading-overlay-box">
        <img className="loading-overlay-logo" src={nutritionLogo} alt="Loading" />
        <div className="spinner-border text-warning" role="status" />
        <span className="loading-overlay-text">{message}</span>
      </div>
    </div>
  )
}

export default LoadingOverlay