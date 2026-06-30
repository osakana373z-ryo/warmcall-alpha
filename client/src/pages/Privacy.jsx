import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="page privacy-page">
      <div className="card privacy-card">
        <h1>隐私与数据使用说明</h1>
        <p className="privacy-intro">
          我们深知，陪伴家人的事需要信任。WarmCall 会谨慎、温柔地处理您和家人的信息。
        </p>

        <section>
          <h2>我们收集什么</h2>
          <ul>
            <li>您的登录账号（手机号或邮箱）</li>
            <li>您为长辈填写的基本资料（姓名、年龄、爱好等）</li>
            <li>长辈与 AI 的聊天文字记录，用于生成陪伴摘要</li>
          </ul>
        </section>

        <section>
          <h2>我们如何使用</h2>
          <ul>
            <li>让 AI 更懂长辈，聊得更贴心</li>
            <li>在聊天结束后，为子女生成温暖、简洁的摘要</li>
            <li>帮助您更好地关心家人的近况</li>
          </ul>
        </section>

        <section>
          <h2>我们如何保护</h2>
          <ul>
            <li>每位用户只能看到自己家人的资料与记录</li>
            <li>密码经过加密保存，不会以明文存储</li>
            <li>长辈专属链接仅可进入聊天，无法查看子女后台</li>
            <li>我们不会向无关第三方出售您的个人信息</li>
          </ul>
        </section>

        <section>
          <h2>给长辈的说明</h2>
          <p>
            长辈通过专属链接聊天时，会看到简短说明：这是一次温暖的文字陪伴，聊天内容会用于给子女一份近况摘要，让家人更放心、更贴心。
          </p>
        </section>

        <section>
          <h2>您的权利</h2>
          <p>
            您可以随时编辑家人资料。如有疑问，欢迎通过产品内反馈渠道联系我们。Alpha
            测试阶段功能仍在完善，我们会持续优化隐私保护。
          </p>
        </section>

        <div className="privacy-actions">
          <Link to="/register" className="btn btn-primary">
            返回注册
          </Link>
          <Link to="/" className="btn btn-ghost">
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
