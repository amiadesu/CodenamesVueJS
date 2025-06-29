-- KEYS[1] - endTurnSelectors key
-- KEYS[2] - updated at key
-- ARGV[1] - newSelector (JSON string)
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
local selector = cjson.decode(ARGV[1])

if not selector then
    return {err = "Invalid parameters"}
end

-- Check for existing selector
for _, s in ipairs(endTurnSelectors) do
    if tostring(s.id) == tostring(selector.id) then
        return {err = "Selector is already end turn selector"}
    end
end

-- Add selector
table.insert(endTurnSelectors, selector)

-- Ensure the entire structure maintains array types
setmetatable(endTurnSelectors, cjson.array_mt)

-- Update Redis
redis.call('SET', KEYS[1], cjson.encode(endTurnSelectors), 'EX', ARGV[2])

-- version increment and updatedAt set
redis.call('SET', KEYS[#KEYS], ARGV[#ARGV], 'EX', ARGV[2])

return {ok = "End turn selector added successfully"}