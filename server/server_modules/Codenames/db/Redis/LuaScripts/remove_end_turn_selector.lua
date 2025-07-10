-- KEYS[1] - endTurnSelectors key
-- KEYS[2] - updated at key
-- ARGV[1] - selectorId (string)
-- ARGV[2] - expire time in seconds (string)
-- ARGV[3] - updated at value (string)

-- Check if data exists
local endTurnSelectors = redis.call('GET', KEYS[1])

if not endTurnSelectors then
    return {err = "Data not found in Redis"}
end

-- Decode JSON data
endTurnSelectors = cjson.decode(endTurnSelectors)

-- Decode selector
local selectorId = ARGV[1]

if not selectorId then
    return {err = "Invalid parameters"}
end

-- Check for existing selector
local endTurnSelectorIndex = -1
for i, s in ipairs(endTurnSelectors) do
    if tostring(s.id) == tostring(selectorId) then
        endTurnSelectorIndex = i
        break
    end
end

if endTurnSelectorIndex == -1 then
    return {err = "Selector not found"}
end

-- Add selector
table.remove(endTurnSelectors, endTurnSelectorIndex)

-- Ensure the entire structure maintains array types
setmetatable(endTurnSelectors, cjson.array_mt)

-- Update Redis
redis.call('SET', KEYS[1], cjson.encode(endTurnSelectors), 'EX', ARGV[2])

-- version increment and updatedAt set
redis.call('SET', KEYS[#KEYS], ARGV[#ARGV], 'EX', ARGV[2])

return {ok = "Selector added successfully"}