/*
  Operational Transformation Engine
  
  An operation has this shape:
  {
    type: "insert" | "delete",
    position: number,
    chars: string,    // for insert
    count: number,    // for delete
    userId: string,
    revision: number
  }

  The server keeps a history of operations per document.
  When a new operation arrives, it is transformed against
  all operations that happened after the client's revision.
*/

const docOperations = new Map()  // docId → array of operations

export const getRevision = (docId) => {
  return (docOperations.get(docId) || []).length
}

export const addOperation = (docId, operation) => {
  if (!docOperations.has(docId)) docOperations.set(docId, [])
  docOperations.get(docId).push(operation)
}

export const transformOperation = (op, against) => {
  /*
    Transform op assuming "against" has already been applied.
    This is the core OT logic.
  */
  if (op.type === "insert" && against.type === "insert") {
    if (against.position <= op.position) {
      return { ...op, position: op.position + against.chars.length }
    }
    return op
  }

  if (op.type === "insert" && against.type === "delete") {
    if (against.position < op.position) {
      return { ...op, position: Math.max(against.position, op.position - against.count) }
    }
    return op
  }

  if (op.type === "delete" && against.type === "insert") {
    if (against.position <= op.position) {
      return { ...op, position: op.position + against.chars.length }
    }
    return op
  }

  if (op.type === "delete" && against.type === "delete") {
    if (against.position < op.position) {
      return { ...op, position: Math.max(against.position, op.position - against.count) }
    }
    return op
  }

  return op
}

export const transformAgainstHistory = (docId, op, fromRevision) => {
  const history = docOperations.get(docId) || []
  const opsAfter = history.slice(fromRevision)

  let transformed = { ...op }
  for (const histOp of opsAfter) {
    transformed = transformOperation(transformed, histOp)
  }
  return transformed
}

export const applyOperation = (content, op) => {
  if (op.type === "insert") {
    return (
      content.slice(0, op.position) +
      op.chars +
      content.slice(op.position)
    )
  }
  if (op.type === "delete") {
    return (
      content.slice(0, op.position) +
      content.slice(op.position + op.count)
    )
  }
  return content
}

export const clearDocOperations = (docId) => {
  docOperations.delete(docId)
}