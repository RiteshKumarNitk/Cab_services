import { NextResponse } from "next/server";

// List pagination, following the convention already used by /api/admin/leads and /api/admin/trips:
//   GET ...?page=2&limit=50  ->  { <key>: [...], total, page, totalPages }
// Callers that send neither `page` nor `limit` keep receiving a plain array (backward compatible),
// capped at LEGACY_CAP newest rows; `X-Has-More: true` signals truncation.

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 200;
export const LEGACY_CAP = 500;

export type PageParams = { paged: boolean; page: number; limit: number; skip: number; take: number };

export function parsePageParams(searchParams: URLSearchParams, defaultLimit = DEFAULT_LIMIT): PageParams {
  const rawPage = searchParams.get("page");
  const rawLimit = searchParams.get("limit");
  const paged = rawPage !== null || rawLimit !== null;

  if (!paged) {
    // Fetch one extra row to detect truncation without a COUNT query.
    return { paged: false, page: 1, limit: LEGACY_CAP, skip: 0, take: LEGACY_CAP + 1 };
  }

  const page = Math.max(1, Math.floor(Number(rawPage ?? "1")) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(Number(rawLimit ?? defaultLimit)) || defaultLimit));
  return { paged: true, page, limit, skip: (page - 1) * limit, take: limit };
}

/**
 * Build the list response. `countFn` is only called in paged mode.
 */
export async function listResponse<T>(
  key: string,
  rows: T[],
  params: PageParams,
  countFn: () => Promise<number>
): Promise<NextResponse> {
  if (!params.paged) {
    const hasMore = rows.length > LEGACY_CAP;
    return NextResponse.json(hasMore ? rows.slice(0, LEGACY_CAP) : rows, {
      headers: hasMore ? { "X-Has-More": "true" } : undefined,
    });
  }
  const total = await countFn();
  return NextResponse.json({
    [key]: rows,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  });
}
