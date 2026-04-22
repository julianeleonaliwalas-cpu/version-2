import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Play, Pause, Download, Clock, Calendar, BarChart3, Settings, Shield, FileText, X } from 'lucide-react'

interface StudySession {
  id: string
  startTime: Date
  endTime?: Date
  subject: string
  tags: string[]
  notes: string
  duration?: number
}

interface WeeklyStats {
  totalHours: number
  sessionsCount: number
  averageSession: number
  subjectBreakdown: Record<string, number>
}

export default function App() {
  const [sessions, setSessions] = useState<StudySession[]>([])
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [showConsent, setShowConsent] = useState(true)
  const [hasConsented, setHasConsented] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sessionNotes, setSessionNotes] = useState('')
  const [customTag, setCustomTag] = useState('')
  const [activeTab, setActiveTab] = useState<'tracker' | 'history' | 'analytics' | 'settings'>('tracker')

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Literature', 'History', 'Languages']
  const commonTags = ['Review', 'Practice', 'Reading', 'Problem Solving', 'Research', 'Assignment', 'Exam Prep']

  useEffect(() => {
    const storedConsent = localStorage.getItem('studyTrackerConsent')
    if (storedConsent === 'true') {
      setHasConsented(true)
      setShowConsent(false)
      loadSessions()
    }
  }, [])

  useEffect(() => {
    if (hasConsented) {
      localStorage.setItem('studyTrackerConsent', 'true')
      saveSessions()
    }
  }, [sessions, hasConsented])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTracking && currentSession) {
      interval = setInterval(() => {
        setCurrentSession(prev => {
          if (!prev) return null
          const now = new Date()
          return {
            ...prev,
            duration: Math.floor((now.getTime() - prev.startTime.getTime()) / 1000)
          }
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking, currentSession])

  const loadSessions = () => {
    const stored = localStorage.getItem('studySessions')
    if (stored) {
      const parsed = JSON.parse(stored)
      setSessions(parsed.map((s: any) => ({
        ...s,
        startTime: new Date(s.startTime),
        endTime: s.endTime ? new Date(s.endTime) : undefined
      })))
    }
  }

  const saveSessions = () => {
    localStorage.setItem('studySessions', JSON.stringify(sessions))
  }

  const handleConsent = (consented: boolean) => {
    setHasConsented(consented)
    setShowConsent(false)
    if (consented) {
      loadSessions()
    }
  }

  const startSession = () => {
    if (!selectedSubject) return
    
    const newSession: StudySession = {
      id: Date.now().toString(),
      startTime: new Date(),
      subject: selectedSubject,
      tags: selectedTags,
      notes: sessionNotes
    }
    
    setCurrentSession(newSession)
    setIsTracking(true)
    setSelectedTags([])
    setSessionNotes('')
  }

  const stopSession = () => {
    if (!currentSession) return
    
    const completedSession: StudySession = {
      ...currentSession,
      endTime: new Date(),
      duration: Math.floor((new Date().getTime() - currentSession.startTime.getTime()) / 1000)
    }
    
    setSessions(prev => [...prev, completedSession])
    setCurrentSession(null)
    setIsTracking(false)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const calculateWeeklyStats = (): WeeklyStats => {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const recentSessions = sessions.filter(s => s.endTime && s.endTime > oneWeekAgo)
    const totalHours = recentSessions.reduce((acc, s) => acc + (s.duration || 0) / 3600, 0)
    const subjectBreakdown: Record<string, number> = {}
    
    recentSessions.forEach(s => {
      if (s.duration) {
        subjectBreakdown[s.subject] = (subjectBreakdown[s.subject] || 0) + s.duration / 3600
      }
    })
    
    return {
      totalHours,
      sessionsCount: recentSessions.length,
      averageSession: recentSessions.length > 0 ? totalHours / recentSessions.length : 0,
      subjectBreakdown
    }
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Subject', 'Duration (minutes)', 'Tags', 'Notes']
    const rows = sessions.map(s => [
      s.startTime.toLocaleDateString(),
      s.subject,
      ((s.duration || 0) / 60).toFixed(1),
      s.tags.join(', '),
      s.notes
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `study-sessions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()])
      setCustomTag('')
    }
  }

  const deleteAllData = () => {
    if (confirm('Are you sure you want to delete all study sessions? This cannot be undone.')) {
      setSessions([])
      localStorage.removeItem('studySessions')
    }
  }

  if (showConsent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <CardTitle className="text-2xl text-slate-900">Study Session Tracker</CardTitle>
            <CardDescription className="text-lg">Privacy-First Study Time Management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🔒 Your Privacy Matters</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• All data is stored locally in your browser</li>
                <li>• No data is sent to external servers</li>
                <li>• You control your data with export and delete options</li>
                <li>• No tracking, analytics, or cookies</li>
                <li>• Works offline - no internet required</li>
              </ul>
            </div>
            
            <div className="bg-slate-100 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-2">📚 What This App Does</h3>
              <p className="text-sm text-slate-700">
                A simple tool to help you track study sessions, organize by subject, 
                add tags for context, and analyze your learning patterns. 
                Perfect for students who want to understand their study habits 
                without compromising privacy.
              </p>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button 
                onClick={() => handleConsent(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                I Agree - Start Tracking
              </Button>
              <Button 
                onClick={() => handleConsent(false)}
                variant="outline"
                className="flex-1"
              >
                Decline
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!hasConsented) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Consent Required</h2>
            <p className="text-slate-600 mb-4">
              You must agree to the privacy terms to use the Study Session Tracker.
            </p>
            <Button onClick={() => setShowConsent(true)}>
              Review Privacy Terms
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = calculateWeeklyStats()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-slate-900">Study Tracker</h1>
            </div>
            <nav className="flex gap-1">
              {(['tracker', 'history', 'analytics', 'settings'] as const).map(tab => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab)}
                  className="capitalize"
                >
                  {tab}
                </Button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'tracker' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isTracking ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    Session Tracker
                  </CardTitle>
                  <CardDescription>
                    {isTracking ? 'Session in progress' : 'Start a new study session'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isTracking && currentSession && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <div className="text-3xl font-mono font-bold text-blue-900 mb-2">
                        {formatDuration(currentSession.duration || 0)}
                      </div>
                      <div className="text-sm text-blue-700">
                        Subject: {currentSession.subject} | Tags: {currentSession.tags.join(', ') || 'None'}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isTracking}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(subject => (
                            <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {commonTags.map(tag => (
                          <Button
                            key={tag}
                            variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleTag(tag)}
                            disabled={isTracking}
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Input
                          placeholder="Custom tag"
                          value={customTag}
                          onChange={(e) => setCustomTag(e.target.value)}
                          disabled={isTracking}
                          onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                        />
                        <Button onClick={addCustomTag} disabled={isTracking} variant="outline">
                          Add
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="What are you studying today?"
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        disabled={isTracking}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    {!isTracking ? (
                      <Button 
                        onClick={startSession} 
                        disabled={!selectedSubject}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Session
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopSession} 
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        End Session
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    This Week
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">{stats.totalHours.toFixed(1)}</div>
                      <div className="text-sm text-slate-600">Hours</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">{stats.sessionsCount}</div>
                      <div className="text-sm text-slate-600">Sessions</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-slate-900">
                      {stats.averageSession.toFixed(1)} min avg
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={exportToCSV} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export to CSV
                  </Button>
                  <Button onClick={() => setActiveTab('history')} variant="outline" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    View History
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <Card>
            <CardHeader>
              <CardTitle>Study History</CardTitle>
              <CardDescription>Your past study sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No study sessions yet. Start your first session!
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice().reverse().map(session => (
                    <div key={session.id} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{session.subject}</h3>
                          <p className="text-sm text-slate-600">
                            {session.startTime.toLocaleDateString()} {session.startTime.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-lg">
                            {formatDuration(session.duration || 0)}
                          </div>
                        </div>
                      </div>
                      {session.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {session.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {session.notes && (
                        <p className="text-sm text-slate-600">{session.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(stats.subjectBreakdown).length === 0 ? (
                  <p className="text-slate-500">No data this week</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.subjectBreakdown).map(([subject, hours]) => (
                      <div key={subject} className="flex justify-between items-center">
                        <span className="text-slate-700">{subject}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(hours / stats.totalHours) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono w-12 text-right">{hours.toFixed(1)}h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Study Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900">
                        {sessions.filter(s => s.duration && s.duration < 1800).length}
                      </div>
                      <div className="text-sm text-slate-600">Short Sessions (&lt;30min)</div>
                    </div>
                    <div className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900">
                        {sessions.filter(s => s.duration && s.duration > 3600).length}
                      </div>
                      <div className="text-sm text-slate-600">Long Sessions (&gt;1hr)</div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-lg font-semibold text-blue-900">
                      Total Sessions: {sessions.length}
                    </div>
                    <div className="text-sm text-blue-700">
                      All time study hours: {(sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 3600).toFixed(1)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings & Privacy
                </CardTitle>
                <CardDescription>Manage your data and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">✅ Privacy Status</h3>
                  <p className="text-sm text-green-800">
                    All data is stored locally in your browser. No data is transmitted to any server.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Data Management</h3>
                    <div className="space-y-3">
                      <Button onClick={exportToCSV} variant="outline" className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Export All Data to CSV
                      </Button>
                      <Button 
                        onClick={deleteAllData} 
                        variant="outline" 
                        className="w-full justify-start text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Delete All Data
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">About</h3>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>Study Session Tracker v1.0</p>
                      <p>A privacy-first study time management tool</p>
                      <p>No tracking, no analytics, no cookies</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}