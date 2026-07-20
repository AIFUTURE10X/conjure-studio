export function isSaasEnforcementOn(): boolean {
  const value = (process.env.SAAS_ENFORCEMENT || '').toLowerCase()
  return value === 'on' || value === 'true' || value === '1'
}
