import './LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <div className="spinner-ring">
        <div className="ring r1"></div>
        <div className="ring r2"></div>
        <div className="ring r3"></div>
      </div>
      <p className="loading-text">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
