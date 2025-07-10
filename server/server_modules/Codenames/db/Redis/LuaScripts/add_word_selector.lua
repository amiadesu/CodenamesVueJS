-- KEYS[1] - words key
-- KEYS[2] - updated at key
-- ARGV[1] - wordText (string)
-- ARGV[2] - newSelector (JSON string)
-- ARGV[3] - expire time in seconds (string)
-- ARGV[4] - updated at value (string)

-- Check if data exists
local words = redis.call('GET', KEYS[1])

if not words then
    return {err = "Data not found in Redis"}
end

-- Decode JSON data
words = cjson.decode(words)

-- Find word index
local wordIndex = -1
for i, word in ipairs(words) do
    if word.text == ARGV[1] then
        wordIndex = i
        break
    end
end

if wordIndex == -1 then
    return {err = "Word not found"}
end

-- Decode selector
local selector = cjson.decode(ARGV[2])

if not selector then
    return {err = "Invalid parameters"}
end

-- Check for existing selector
for _, s in ipairs(words[wordIndex].selectedBy) do
    if tostring(s.id) == tostring(selector.id) then
        return {err = "Selector already exists in current words"}
    end
end

-- Add selector
table.insert(words[wordIndex].selectedBy, selector)

-- Ensure the entire structure maintains array types
-- Helper: force empty arrays to stay arrays
local function force_empty_array(t)
    if type(t) == "table" and #t == 0 then
        t[1] = "__DUMMY__"
        return true
    end
    return false
end

-- Fix empty selectedBy fields
for i = 1, #words do
    force_empty_array(words[i].selectedBy)
end

-- Encode words
local encoded = cjson.encode(words)

-- Clean up dummy ["__DUMMY__"] → []
encoded = string.gsub(encoded, '%["__DUMMY__"%]', '[]')

-- Update Redis
redis.call('SET', KEYS[1], encoded, 'EX', ARGV[3])

-- version increment and updatedAt set
redis.call('SET', KEYS[#KEYS], ARGV[#ARGV], 'EX', ARGV[3])

return {ok = "Selector added successfully"}