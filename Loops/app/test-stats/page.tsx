"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ContractService } from "@/lib/contractService"
import { useWallet } from "@/contexts/WalletContext"

export default function TestStatsPage() {
  const { selector, accountId, isConnected } = useWallet()
  const [contractService, setContractService] = useState<ContractService | null>(null)
  const [testResult, setTestResult] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  // Initialize contract service when wallet is connected
  useState(() => {
    if (selector && accountId) {
      const account = selector.store.getState().accounts[0]
      if (account) {
        const newContractService = new ContractService(selector, account)
        setContractService(newContractService)
      }
    }
  })

  const testContractStats = async () => {
    if (!contractService) {
      setTestResult("❌ Contract service not initialized")
      return
    }

    setIsLoading(true)
    try {
      const stats = await contractService.getContractStats()
      setTestResult(`✅ Contract Stats: ${JSON.stringify(stats, null, 2)}`)
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testUserStats = async () => {
    if (!contractService || !accountId) {
      setTestResult("❌ Contract service or account not available")
      return
    }

    setIsLoading(true)
    try {
      const stats = await contractService.getUserComprehensiveStats(accountId)
      setTestResult(`✅ User Stats: ${JSON.stringify(stats, null, 2)}`)
    } catch (error: any) {
      setTestResult(`❌ Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Contract Statistics Test</h1>
        
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Connection Status</h2>
          <div className="space-y-2 text-white/80">
            <p>Wallet Connected: {isConnected ? "✅ Yes" : "❌ No"}</p>
            <p>Account ID: {accountId || "Not connected"}</p>
            <p>Contract Service: {contractService ? "✅ Initialized" : "❌ Not initialized"}</p>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Test Actions</h2>
          <div className="space-x-4">
            <Button 
              onClick={testContractStats} 
              disabled={isLoading || !contractService}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Test Contract Stats
            </Button>
            <Button 
              onClick={testUserStats} 
              disabled={isLoading || !contractService || !accountId}
              className="bg-green-600 hover:bg-green-700"
            >
              Test User Stats
            </Button>
          </div>
        </div>

        {testResult && (
          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Test Result</h2>
            <pre className="text-white/80 text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
