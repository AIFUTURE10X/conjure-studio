"use client"

/**
 * AccountManager Component
 *
 * Dropdown for managing user accounts:
 * - Shows current user ID
 * - Lists all accounts with logo counts
 * - Merge all accounts into current
 * - Switch between accounts
 */

import { useState, useEffect } from 'react'
import { User, Users, Merge, RefreshCw, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import {
  getUserId,
  fetchAllUserAccounts,
  mergeAllAccounts,
  switchToAccount,
} from '@/lib/user-id'

interface UserAccount {
  userId: string
  count: number
  lastCreated: string
}

export function AccountManager() {
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [accounts, setAccounts] = useState<UserAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Load current user ID on mount
  useEffect(() => {
    setCurrentUserId(getUserId())
  }, [])

  // Fetch all accounts when popover opens
  useEffect(() => {
    if (isOpen && accounts.length === 0) {
      setIsLoading(true)
      fetchAllUserAccounts().then(fetchedAccounts => {
        setAccounts(fetchedAccounts)
        setIsLoading(false)
      })
    }
  }, [isOpen, accounts.length])

  // Merge all accounts
  const handleMerge = async () => {
    setIsMerging(true)
    const result = await mergeAllAccounts()

    if (result.success) {
      toast.success(`Merged ${result.merged} logos into your account!`)
      // Refresh accounts list
      const fetchedAccounts = await fetchAllUserAccounts()
      setAccounts(fetchedAccounts)
      // Refresh the page to show all logos
      setTimeout(() => window.location.reload(), 500)
    } else {
      toast.error(result.error || 'Merge failed')
    }

    setIsMerging(false)
  }

  // Switch to a different account
  const handleSwitch = (userId: string) => {
    if (userId === currentUserId) return
    toast.info('Switching account...')
    switchToAccount(userId)
  }

  // Total logos across all accounts
  const totalLogos = accounts.reduce((sum, acc) => sum + acc.count, 0)
  const otherAccountsCount = accounts.filter(a => a.userId !== currentUserId).length

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <Users className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline text-xs">Account</span>
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 bg-zinc-900 border-zinc-700 p-0">
        {/* Header */}
        <div className="p-3 border-b border-zinc-700">
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <User className="w-4 h-4" />
            <span>Current Account</span>
          </div>
          <div className="text-xs text-zinc-500 mt-1 font-mono truncate">
            {currentUserId || 'Loading...'}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="w-4 h-4 animate-spin text-zinc-500" />
            <span className="ml-2 text-sm text-zinc-500">Loading accounts...</span>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="px-3 py-2 text-xs text-zinc-500 border-b border-zinc-800">
              {totalLogos} total logos across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </div>

            {/* Merge button - only show if there are other accounts */}
            {otherAccountsCount > 0 && (
              <div className="p-2 border-b border-zinc-700">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-amber-400 hover:text-amber-300 hover:bg-zinc-800 transition-colors text-sm disabled:opacity-50"
                  onClick={handleMerge}
                  disabled={isMerging}
                >
                  {isMerging ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Merge className="w-4 h-4" />
                  )}
                  <span>Merge All ({otherAccountsCount} accounts)</span>
                </button>
              </div>
            )}

            {/* Account list */}
            <div className="p-2">
              <div className="text-zinc-500 text-xs px-2 py-1 mb-1">All Accounts</div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {accounts.map((account) => (
                  <button
                    key={account.userId}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                      account.userId === currentUserId
                        ? 'bg-zinc-800/50 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                    onClick={() => handleSwitch(account.userId)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {account.userId === currentUserId && (
                        <Check className="w-3 h-3 text-green-500 shrink-0" />
                      )}
                      <span className="text-xs font-mono truncate max-w-[140px]">
                        {account.userId.replace('user-', '').slice(0, 15)}...
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500 shrink-0">
                      {account.count} logo{account.count !== 1 ? 's' : ''}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
