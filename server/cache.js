// 공공 API 호출 아낌이: 같은 요청은 ttl 동안 메모리에 둔 값을 다시 쓴다.
// 호출 한도 초과나 일시 장애로 실패하면, 지난 값이 있으면 그것을 대신 돌려준다 (없을 때만 오류).
const store = new Map()

export async function memo(key, ttlMs, fn) {
  const hit = store.get(key)
  if (hit && Date.now() - hit.at < ttlMs) return hit.value
  try {
    const value = await fn()
    store.set(key, { at: Date.now(), value })
    if (store.size > 300) store.delete(store.keys().next().value) // 메모리가 무한히 늘지 않게
    return value
  } catch (e) {
    if (hit) return hit.value
    throw e
  }
}
