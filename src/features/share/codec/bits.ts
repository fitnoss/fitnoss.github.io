export class DecodeError extends Error {}

export class BitWriter {
  bits: number[] = []

  write(value: number, width: number) {
    for (let i = width - 1; i >= 0; i--) this.bits.push((value >>> i) & 1)
  }

  bit(b: boolean) {
    this.bits.push(b ? 1 : 0)
  }

  /** Unsigned varint in 4-bit groups, each followed by a "more" bit. 0..15 cost 5 bits. */
  varint(value: number) {
    if (!Number.isInteger(value) || value < 0) throw new RangeError(`varint: ${value}`)
    const groups: number[] = []
    do {
      groups.push(value & 15)
      value = Math.floor(value / 16)
    } while (value > 0)
    groups.forEach((g, i) => {
      this.write(g, 4)
      this.bit(i < groups.length - 1)
    })
  }
}

export class BitReader {
  pos = 0
  constructor(readonly bits: number[]) {}

  read(width: number) {
    if (this.pos + width > this.bits.length) throw new DecodeError("truncated")
    let v = 0
    for (let i = 0; i < width; i++) v = v * 2 + this.bits[this.pos++]
    return v
  }

  bit() {
    return this.read(1) === 1
  }

  varint() {
    let value = 0
    let mul = 1
    for (let i = 0; i < 8; i++) {
      value += this.read(4) * mul
      mul *= 16
      if (!this.bit()) return value
    }
    throw new DecodeError("varint too long")
  }
}

/**
 * Canonical Huffman code for symbols 0..n-1 with the given frequencies: frequent symbols get
 * short codes. Deterministic (ties break by symbol index), so both sides build the same code.
 */
export class Huffman {
  private codes: { bits: number; len: number }[] = []
  private decode = new Map<string, number>()

  constructor(freq: number[]) {
    type Node = { w: number; syms: number[]; order: number }
    let nodes: Node[] = freq.map((w, s) => ({ w, syms: [s], order: s }))
    const lens = freq.map(() => 0)
    let order = freq.length
    while (nodes.length > 1) {
      nodes.sort((a, b) => a.w - b.w || a.order - b.order)
      const [a, b] = nodes
      for (const s of [...a.syms, ...b.syms]) lens[s]++
      nodes = [{ w: a.w + b.w, syms: [...a.syms, ...b.syms], order: order++ }, ...nodes.slice(2)]
    }
    const syms = freq.map((_, s) => s).sort((a, b) => lens[a] - lens[b] || a - b)
    let code = 0
    let prev = lens[syms[0]]
    for (const s of syms) {
      code <<= lens[s] - prev
      prev = lens[s]
      this.codes[s] = { bits: code, len: lens[s] }
      this.decode.set(`${lens[s]}:${code}`, s)
      code++
    }
  }

  /** Code length of a symbol, in bits. */
  cost(sym: number) {
    return this.codes[sym].len
  }

  write(w: BitWriter, sym: number) {
    const { bits, len } = this.codes[sym]
    w.write(bits, len)
  }

  read(r: BitReader) {
    let code = 0
    for (let len = 1; len <= 24; len++) {
      code = code * 2 + r.read(1)
      const s = this.decode.get(`${len}:${code}`)
      if (s !== undefined) return s
    }
    throw new DecodeError("bad code")
  }
}

/** CRC-6 (poly x^6 + x + 1) over a bit sequence. */
export function crc6(bits: number[]) {
  let crc = 0
  for (const b of bits) {
    const top = ((crc >> 5) & 1) ^ b
    crc = (crc << 1) & 63
    if (top) crc ^= 0b000011
  }
  return crc
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"

export function bitsToBase64url(bits: number[]) {
  let out = ""
  for (let i = 0; i < bits.length; i += 6) {
    let v = 0
    for (let j = 0; j < 6; j++) v = v * 2 + (bits[i + j] ?? 0)
    out += B64[v]
  }
  return out
}

export function base64urlToBits(s: string) {
  const bits: number[] = []
  for (const ch of s) {
    const v = B64.indexOf(ch)
    if (v < 0) throw new DecodeError(`bad char ${ch}`)
    for (let j = 5; j >= 0; j--) bits.push((v >> j) & 1)
  }
  return bits
}
