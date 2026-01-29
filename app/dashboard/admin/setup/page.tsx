"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Database, Copy, ExternalLink } from "lucide-react";

interface DbStatus {
  name: string;
  envKey: string;
  configured: boolean;
}

interface SetupResult {
  name: string;
  id: string;
  envKey: string;
}

export default function SetupDatabasesPage() {
  const [status, setStatus] = useState<DbStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [parentPageId, setParentPageId] = useState("");
  const [results, setResults] = useState<SetupResult[]>([]);
  const [envContent, setEnvContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/admin/setup-databases");
      const data = await res.json();
      setStatus(data.status || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createDatabases = async () => {
    if (!parentPageId.trim()) {
      setError("Please enter a Parent Page ID");
      return;
    }

    setCreating(true);
    setError("");
    setResults([]);
    setEnvContent("");

    try {
      const res = await fetch(`/api/admin/setup-databases?parentPageId=${parentPageId}`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        setResults(data.created || []);
        setEnvContent(data.envContent || "");
        fetchStatus(); // Refresh status
      } else {
        setError(data.error || "Failed to create databases");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const missingCount = status.filter((s) => !s.configured).length;
  const configuredCount = status.filter((s) => s.configured).length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Setup Notion Databases</h1>
        <p className="text-muted-foreground mt-1">
          Configure all required Notion databases for iCAN Platform
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{status.length}</div>
            <div className="text-sm text-muted-foreground">Total Databases</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">{configuredCount}</div>
            <div className="text-sm text-muted-foreground">Configured</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-600">{missingCount}</div>
            <div className="text-sm text-muted-foreground">Missing</div>
          </CardContent>
        </Card>
      </div>

      {/* Database Status List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <div className="space-y-2">
              {status.map((db) => (
                <div
                  key={db.envKey}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {db.configured ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">{db.name}</div>
                      <div className="text-xs text-muted-foreground">{db.envKey}</div>
                    </div>
                  </div>
                  <div className="text-sm">
                    {db.configured ? (
                      <span className="text-green-600">Configured</span>
                    ) : (
                      <span className="text-red-600">Missing</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Form */}
      {missingCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Create Missing Databases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm space-y-2">
              <p className="font-medium">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Buka Notion dan buat page baru (contoh: "iCAN Databases")</li>
                <li>
                  Share page tersebut dengan Notion Integration Anda
                  <a
                    href="https://www.notion.so/my-integrations"
                    target="_blank"
                    rel="noopener"
                    className="text-blue-600 ml-1 inline-flex items-center"
                  >
                    (Manage Integrations <ExternalLink className="w-3 h-3 ml-1" />)
                  </a>
                </li>
                <li>Copy Page ID dari URL (contoh: notion.so/PageName-<strong>abc123def456</strong>)</li>
                <li>Paste Page ID di bawah dan klik "Create Databases"</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Parent Page ID</label>
              <input
                type="text"
                value={parentPageId}
                onChange={(e) => setParentPageId(e.target.value)}
                placeholder="e.g., abc123def456789..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button onClick={createDatabases} disabled={creating} className="w-full">
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Databases...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Create {missingCount} Missing Databases
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✅ Databases Created Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {results.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.id}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(r.id)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {envContent && (
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Add to .env.local:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(envContent)}
                  >
                    <Copy className="w-4 h-4 mr-1" /> Copy
                  </Button>
                </div>
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{envContent}</pre>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">⚠️ Important:</p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                Setelah menambahkan environment variables ke .env.local, restart Next.js server Anda.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Configured */}
      {missingCount === 0 && !loading && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  All Databases Configured!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Semua database Notion sudah terkonfigurasi dengan benar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
