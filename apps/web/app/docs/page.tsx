'use client';

import React, { useState, useMemo } from 'react';
import { DOCS_DATA, DocItem } from '@/lib/docs-content';
import { CodeTabs } from '@/components/docs/CodeTabs';
import { DocsCallout } from '@/components/docs/DocsCallout';
import { InteractivePlayground } from '@/components/docs/InteractivePlayground';
import { CodeBlock } from '@/components/code/CodeBlock';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  Search,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileCode2,
  Shield,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function DocsPage() {
  const [selectedSectionId, setSelectedSectionId] = useState('getting-started');
  const [selectedItemId, setSelectedItemId] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Find active doc item
  const activeSection = DOCS_DATA.find((s) => s.id === selectedSectionId) || DOCS_DATA[0];
  const activeItem =
    activeSection.items.find((i) => i.id === selectedItemId) || activeSection.items[0];

  // Flattened list for next/prev navigation
  const allItems = useMemo(() => {
    return DOCS_DATA.flatMap((s) => s.items.map((i) => ({ ...i, sectionId: s.id })));
  }, []);

  const currentIndex = allItems.findIndex((i) => i.id === activeItem.id);
  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null;
  const nextItem = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;

  // Filtered navigation
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return DOCS_DATA;
    const q = searchQuery.toLowerCase();
    return DOCS_DATA.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.content.lead.toLowerCase().includes(q)
      ),
    })).filter((section) => section.items.length > 0);
  }, [searchQuery]);

  const selectDoc = (sectionId: string, itemId: string) => {
    setSelectedSectionId(sectionId);
    setSelectedItemId(itemId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP DOCS HERO / SEARCH BANNER */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                DOCUMENTATION & PACKAGES
              </Badge>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-mono">v1.4.0 (Fastify + Gemini 3.7)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <span>CodeGuard AI Developer Hub</span>
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Explore comprehensive guides, package APIs, zero-trust AST scanning workflows, and integration recipes modeled after Socket.io, Sequelize, and Mintlify.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="http://localhost:3000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3 h-3" />}>
                Swagger OpenAPI
              </Button>
            </a>
            <Link href="/terminal">
              <Button variant="primary" size="sm" rightIcon={<Zap className="w-3 h-3" />}>
                Interactive CLI
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. THREE-COLUMN DOCS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Sticky Navigation Sidebar */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-3 space-y-4 lg:sticky lg:top-20">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search docs & APIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-input border border-border focus:border-ring text-xs text-foreground outline-none transition-colors"
            />
          </div>

          <div className="space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
            {filteredSections.map((section) => (
              <div key={section.id} className="space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 flex items-center justify-between">
                  <span>{section.title}</span>
                  <span className="text-[9px] font-mono text-muted-foreground/60">
                    {section.items.length}
                  </span>
                </div>

                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isSelected = selectedItemId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => selectDoc(section.id, item.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between group ${
                          isSelected
                            ? 'bg-primary/10 text-primary font-semibold border border-primary/20 shadow-xs'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-muted text-muted-foreground border border-border/50 group-hover:border-border">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: Main Content Pane */}
        <div className="lg:col-span-9 space-y-6">
          {/* Breadcrumb Header */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-b border-border/60 pb-3 font-mono">
            <span>Docs</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
            <span>{activeSection.title}</span>
            <ChevronRight className="w-3 h-3 opacity-60" />
            <span className="text-foreground font-semibold">{activeItem.title}</span>
          </div>

          {/* Doc Title & Lead */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {activeItem.title}
              </h2>
              {activeItem.badge && (
                <Badge variant="primary" size="md">
                  {activeItem.badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed font-medium">
              {activeItem.content.lead}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeItem.content.overview}
            </p>
          </div>

          {/* Quick Install Tabs if present */}
          {activeItem.content.installCommand && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
                Installation
              </h3>
              <CodeTabs commands={activeItem.content.installCommand} />
            </div>
          )}

          {/* Key Concepts */}
          {activeItem.content.keyConcepts && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span>Architecture & Core Concepts</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeItem.content.keyConcepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-border bg-card hover:bg-card-hover transition-colors space-y-1"
                  >
                    <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      <span>{concept.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {concept.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Live Playground */}
          <InteractivePlayground />

          {/* Code Examples */}
          {activeItem.content.codeExamples && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-accent" />
                <span>Code Examples & Usage Recipes</span>
              </h3>

              {activeItem.content.codeExamples.map((example, idx) => (
                <div key={idx} className="space-y-2">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">{example.title}</h4>
                    <p className="text-xs text-muted-foreground">{example.description}</p>
                  </div>
                  <CodeBlock
                    code={example.code}
                    language={example.language}
                    filename={example.filename}
                  />
                </div>
              ))}
            </div>
          )}

          {/* API Reference Table if present */}
          {activeItem.content.apiReference && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-warning" />
                <span>API Reference</span>
              </h3>

              {activeItem.content.apiReference.map((apiItem, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
                    <div className="font-mono text-xs font-bold text-primary">
                      {apiItem.name}
                    </div>
                    <code className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/50">
                      {apiItem.signature}
                    </code>
                  </div>

                  <p className="text-xs text-muted-foreground">{apiItem.description}</p>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Parameters
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border text-[10px] font-mono text-muted-foreground">
                            <th className="py-1.5 pr-4">Name</th>
                            <th className="py-1.5 pr-4">Type</th>
                            <th className="py-1.5 pr-4">Required</th>
                            <th className="py-1.5">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                          {apiItem.parameters.map((param, pIdx) => (
                            <tr key={pIdx}>
                              <td className="py-2 pr-4 font-semibold text-foreground">{param.name}</td>
                              <td className="py-2 pr-4 text-primary">{param.type}</td>
                              <td className="py-2 pr-4">
                                {param.required ? (
                                  <span className="text-rose-400">Yes</span>
                                ) : (
                                  <span className="text-muted-foreground">Optional</span>
                                )}
                              </td>
                              <td className="py-2 text-muted-foreground font-sans text-xs">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-muted-foreground pt-2 border-t border-border/40 flex items-center gap-2">
                    <span className="text-foreground font-semibold font-sans">Returns:</span>
                    <span className="text-accent">{apiItem.returns}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Callout Notice */}
          <DocsCallout type="tip" title="Zero-Trust Monorepo Integration">
            All CodeGuard packages are completely treeshakeable and run natively in Node.js 18+, Bun, Docker, and edge runtime environments.
          </DocsCallout>

          {/* Pager Navigation (Prev / Next) */}
          <div className="flex items-center justify-between border-t border-border/60 pt-6 mt-8">
            {prevItem ? (
              <button
                onClick={() => selectDoc(prevItem.sectionId, prevItem.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-border-focus hover:bg-muted text-left transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-mono">Previous</div>
                  <div className="text-xs font-semibold text-foreground">{prevItem.title}</div>
                </div>
              </button>
            ) : (
              <div />
            )}

            {nextItem && (
              <button
                onClick={() => selectDoc(nextItem.sectionId, nextItem.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-border-focus hover:bg-muted text-right transition-colors"
              >
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase font-mono">Next</div>
                  <div className="text-xs font-semibold text-foreground">{nextItem.title}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
