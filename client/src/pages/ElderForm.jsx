import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

const emptyForm = {
  name: '',
  age: '',
  relationship: '',
  hobbies: '',
  health_reminders: '',
  family_members: '',
};

export default function ElderForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [parentConsent, setParentConsent] = useState(isEdit);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api
      .getElder(id)
      .then((elder) => {
        setForm({
          name: elder.name || '',
          age: elder.age ?? '',
          relationship: elder.relationship || '',
          hobbies: elder.hobbies || '',
          health_reminders: elder.health_reminders || '',
          family_members: (elder.family_members || []).join('、'),
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!isEdit && !parentConsent) {
      setError('添加老人资料前，请先阅读并同意隐私说明');
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name,
      age: form.age ? Number(form.age) : null,
      relationship: form.relationship,
      hobbies: form.hobbies,
      health_reminders: form.health_reminders,
      family_members: form.family_members
        .split(/[、,，]/)
        .map((s) => s.trim())
        .filter(Boolean),
      parent_consent: isEdit ? true : parentConsent,
    };

    try {
      if (isEdit) {
        await api.updateElder(id, payload);
        navigate(`/elders/${id}`);
      } else {
        const elder = await api.createElder(payload);
        navigate(`/elders/${elder.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div className="page form-page">
      <div className="page-header">
        <h1>{isEdit ? '编辑家人资料' : '添加家人资料'}</h1>
        <p className="subtitle">完善信息，让 AI 陪伴更懂 Ta</p>
      </div>

      <form className="card form-card" onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}

        <div className="form-group">
          <label htmlFor="name">姓名 *</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="例如：王奶奶"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="age">年龄</label>
            <input
              id="age"
              name="age"
              type="number"
              min="1"
              max="120"
              value={form.age}
              onChange={handleChange}
              placeholder="78"
            />
          </div>
          <div className="form-group">
            <label htmlFor="relationship">与您的关系</label>
            <input
              id="relationship"
              name="relationship"
              value={form.relationship}
              onChange={handleChange}
              placeholder="母亲"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="hobbies">爱好</label>
          <input
            id="hobbies"
            name="hobbies"
            value={form.hobbies}
            onChange={handleChange}
            placeholder="太极、养花、听戏曲"
          />
        </div>

        <div className="form-group">
          <label htmlFor="health_reminders">健康提醒</label>
          <textarea
            id="health_reminders"
            name="health_reminders"
            value={form.health_reminders}
            onChange={handleChange}
            rows={3}
            placeholder="每天早晚各服降压药；注意低盐饮食"
          />
        </div>

        <div className="form-group">
          <label htmlFor="family_members">家庭成员</label>
          <input
            id="family_members"
            name="family_members"
            value={form.family_members}
            onChange={handleChange}
            placeholder="儿子小明、女儿小红（用顿号或逗号分隔）"
          />
        </div>

        {!isEdit && (
          <label className="consent-checkbox">
            <input
              type="checkbox"
              checked={parentConsent}
              onChange={(e) => setParentConsent(e.target.checked)}
            />
            <span>
              我已阅读并同意
              <Link to="/privacy" target="_blank" rel="noreferrer">
                《隐私与数据使用说明》
              </Link>
              ，并确认可以为长辈建立陪伴档案
            </span>
          </label>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/family')}>
            取消
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
