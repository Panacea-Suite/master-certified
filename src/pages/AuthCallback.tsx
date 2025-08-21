import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const [err, setErr] = useState<string>();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      // Supabase reads the session from URL automatically
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { setErr(error?.message || 'Sign-in failed'); return; }

      // Optional: link user to brand/campaign via your RPC
      const optIn = sessionStorage.getItem('marketing_opt_in') === '1';
      const flowSessionId = sessionStorage.getItem('flow_session_id');

      if (flowSessionId) {
        const { error: rpcErr } = await supabase.rpc('link_user_to_flow', {
          p_session_id: flowSessionId,
          p_user_id: user.id,
          p_marketing_opt_in: optIn,
          p_created_via: 'google',
        });
        if (rpcErr) { setErr(rpcErr.message); return; }
      }

      // Clean up and return to the flow
      sessionStorage.removeItem('marketing_opt_in');
      // sessionStorage.removeItem('flow_session_id');

      const returnTo = sessionStorage.getItem('return_to') || '/flow';
      sessionStorage.removeItem('return_to');
      navigate(returnTo, { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="p-6">
      <p>Completing sign-in…</p>
      {err && <p className="text-red-600">{err}</p>}
    </div>
  );
}