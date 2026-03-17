"use client";

import { useState, useEffect, useRef } from "react";
import { datasets as datasetsApi, ai } from "@/lib/api";
import type { Dataset, AskResponse, AIQuery } from "@/lib/types";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Send,
  Database,
  Lightbulb,
  User,
  Bot,
  History,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export default function AIChatPage() {
  const [datasetList, setDatasetList] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [indexing, setIndexing] = useState(false);
  const [isIndexed, setIsIndexed] = useState(false);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [history, setHistory] = useState<AIQuery[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await datasetsApi.list(1, 100);
        setDatasetList(response.datasets);
        if (response.datasets.length > 0) {
          setSelectedDataset(response.datasets[0].dataset_id);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load testcase documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      fetchHistory();
      setMessages([]);
      setSuggestions(null);
      setIsIndexed(false);
    }
  }, [selectedDataset]);

  const fetchHistory = async () => {
    if (!selectedDataset) return;
    try {
      const response = await ai.queries(selectedDataset, historyPage, 10);
      setHistory(response.items);
      setHistoryTotal(response.total);
    } catch {
      // History might not be available yet
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [historyPage, selectedDataset]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleIndex = async () => {
    if (!selectedDataset) return;

    setIndexing(true);
    try {
      const result = await ai.index(selectedDataset);
      toast.success(`Indexed ${result.defects_processed} defects with ${result.chunks_created} chunks`);
      setIsIndexed(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to index testcase document");
    } finally {
      setIndexing(false);
    }
  };

  const handleAsk = async () => {
    if (!selectedDataset || !question.trim()) return;

    const userMessage = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setAsking(true);

    try {
      const response = await ai.ask({
        dataset_id: selectedDataset,
        question: userMessage,
        top_k: 5,
      });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.answer, sources: response.sources },
      ]);
      setIsIndexed(true);
      fetchHistory();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to get response");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setAsking(false);
    }
  };

  const handleSuggestions = async () => {
    if (!selectedDataset) return;

    setLoadingSuggestions(true);
    try {
      const response = await ai.suggestions(selectedDataset);
      setSuggestions(response.suggestions);
      setIsIndexed(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to get suggestions");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const historyTotalPages = Math.ceil(historyTotal / 10);

  if (loading) {
    return (
      <>
        <Topbar title="AI Chat" description="Ask AI about your defect data" />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="AI Chat" description="Ask AI about your defect data" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-7rem)]">
        {/* Main Chat Area */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Dataset Selector & Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Testcase Document</Label>
                  <Select
                    value={selectedDataset?.toString() ?? ""}
                    onValueChange={(value) => setSelectedDataset(Number(value))}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a testcase document" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasetList.map((dataset) => (
                        <SelectItem key={dataset.dataset_id} value={dataset.dataset_id.toString()}>
                          {dataset.file_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={handleIndex}
                  disabled={!selectedDataset || indexing}
                >
                  {indexing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Indexing...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Index Document
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSuggestions}
                  disabled={!selectedDataset || loadingSuggestions}
                >
                  {loadingSuggestions ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Get Suggestions
                    </>
                  )}
                </Button>
                {isIndexed && (
                  <Badge variant="secondary" className="mb-1">
                    <Sparkles className="mr-1 h-3 w-3" />
                    Indexed
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="text-base">Chat</CardTitle>
              <CardDescription>Ask questions about your defect data</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                    <Bot className="h-12 w-12 mb-4" />
                    <p>Ask a question about your defects</p>
                    <p className="text-sm mt-1">
                      Index your testcase document first for best results
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.role === "assistant" && (
                          <div className="rounded-full bg-secondary p-2 h-8 w-8 flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <p className="text-xs text-muted-foreground mb-1">Sources:</p>
                              <div className="flex flex-wrap gap-1">
                                {message.sources.map((source, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {message.role === "user" && (
                          <div className="rounded-full bg-primary p-2 h-8 w-8 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="pt-4 flex gap-2">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about defect patterns, trends, or specific issues..."
                  className="resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAsk();
                    }
                  }}
                />
                <Button
                  onClick={handleAsk}
                  disabled={!selectedDataset || !question.trim() || asking}
                  className="shrink-0"
                >
                  {asking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Suggestions */}
          {suggestions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {suggestions}
                  </p>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Query History */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Query History
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">No queries yet</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="flex-1">
                    <div className="flex flex-col gap-2">
                      {history.map((query) => (
                        <button
                          key={query.query_id}
                          onClick={() => setQuestion(query.question)}
                          className="text-left p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <p className="text-sm font-medium text-foreground truncate">
                            {query.question}
                          </p>
                          {query.asked_at && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(query.asked_at).toLocaleString()}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                  {historyTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Page {historyPage} of {historyTotalPages}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={historyPage === 1}
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                          disabled={historyPage === historyTotalPages}
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
