import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { setElderSession } from '../utils/elderSession';

export default function ElderBind() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleDigit(index, value) {
    const num = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = num;
    setDigits(next);
    setError('');

    if (num && index < 3) {
      document.getElementById(`digit-${index + 1}`)?.focus();
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      document.getElementById(`digit-${index - 1}`)?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 4) {
      setError('请输入 4 位数字');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const elder = await api.bindElder(code);
      setElderSession(code, elder.name);
      navigate('/elder/home');
    } catch (err) {
      setError(err.message);
      setDigits(['', '', '', '']);
      document.getElementById('digit-0')?.focus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page elder-bind-page">
      <Link to="/" className="elder-back-link">
        ← 返回
      </Link>

      <div className="elder-bind-card card">
        <div className="elder-bind-icon">🔢</div>
        <h1>请输入邀请码</h1>
        <p className="elder-bind-hint">请让家人告诉您 4 位数字</p>

        {error && <div className="error-banner elder-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="digit-inputs" role="group" aria-label="四位数字邀请码">
            {digits.map((d, i) => (
              <input
                key={i}
                id={`digit-${i}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                className="digit-input"
                value={d}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
                aria-label={`第 ${i + 1} 位数字`}
              />
            ))}
          </div>

          <button type="submit" className="btn btn-primary btn-elder btn-block" disabled={loading}>
            {loading ? '正在进入...' : '进入'}
          </button>
        </form>
      </div>
    </div>
  );
}
