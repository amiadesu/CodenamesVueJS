-- KEYS[1] - chatMessages key
-- KEYS[2] - updated at key
-- ARGV[1] - newMessage (JSON string)
-- ARGV[2] - messages limit (string)
-- ARGV[3] - expire time in seconds (string)
-- ARGV[4] - updated at value (string)

-- Check if data exists
local chatMessages = redis.call('GET', KEYS[1])

if not chatMessages then
    return {err = "Data not found in Redis"}
end

-- Decode JSON data
chatMessages = cjson.decode(chatMessages)

-- Decode selector
local newMessage = cjson.decode(ARGV[1])

if not newMessage then
    return {err = "Invalid parameters"}
end

-- Add selector
table.insert(chatMessages, newMessage)
if #chatMessages > tonumber(ARGV[2]) then
    table.remove(chatMessages, 1)
end

-- Update Redis
redis.call('SET', KEYS[1], cjson.encode(chatMessages), 'EX', ARGV[3])

-- version increment and updatedAt set
redis.call('SET', KEYS[#KEYS], ARGV[#ARGV], 'EX', ARGV[3])

return {ok = "End turn selector added successfully"}