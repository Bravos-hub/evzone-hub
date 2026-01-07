import { useNavigate } from 'react-router-dom'
export function UnauthorizedPage() {
  const nav = useNavigate()
  return (
    <div className="max-w-[700px] mx-auto my-20 p-[18px]">
      <h1 className="m-0">Unauthorized</h1>
      <p className="text-muted">Your current role doesn't have access to that page.</p>
      <button
        className="bg-accent border border-accent text-white py-[10px] px-[18px] rounded-lg cursor-pointer text-[13px] font-semibold transition-all duration-200 shadow-[0_2px_4px_rgba(59,130,246,.2)] whitespace-nowrap hover:bg-accent-hover hover:border-accent-hover hover:shadow-[0_4px_8px_rgba(59,130,246,.3)] hover:-translate-y-[1px] active:translate-y-0"
        onClick={() => nav('/auth/login')}
      >
        Switch role
      </button>
    </div>
  )
}

