import re

with open("src/components/RuleEngine/RuleEngineDashboard.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Update TabList (Add the new tabs)
pattern_tabs = r"(\{!showTripOnly && <Tab [^>]*>NorthBound Payloads</Tab>\})(\s*)(<\/TabList>)"
replacement_tabs = r'\1\2<Tab justifyContent="flex-start" py={2} px={3} borderRadius="md" fontWeight="bold" fontSize="sm" color="gray.600" _hover={{ bg: "gray.100" }} _selected={{ bg: "blue.50", color: "blue.700", fontWeight: "bold" }}>Vehicle Controls</Tab>\2{!showTripOnly && <Tab justifyContent="flex-start" py={2} px={3} borderRadius="md" fontWeight="bold" fontSize="sm" color="gray.600" _hover={{ bg: "gray.100" }} _selected={{ bg: "blue.50", color: "blue.700", fontWeight: "bold" }}>Cloud Simulation</Tab>}\2{!showTripOnly && <Tab justifyContent="flex-start" py={2} px={3} borderRadius="md" fontWeight="bold" fontSize="sm" color="gray.600" _hover={{ bg: "gray.100" }} _selected={{ bg: "blue.50", color: "blue.700", fontWeight: "bold" }}>FOTA Status</Tab>}\2\3'

text = re.sub(pattern_tabs, replacement_tabs, text)

# 2. Extract Card Bodies
vehicle_card_re = re.compile(r"\{\/\* 1\. Vehicle Simulation Control \*\/\}.*?<CardBody p=\{\{ base: 3, md: 4 \}\}>\s*(<VStack spacing=\{\{ base: 4, md: 5 \}\} align=\"stretch\">\s*<FormControl>\s*<Flex justify=\"space-between\" align=\"center\" mb=\{2\}>.*?<\/VStack>)\s*<\/CardBody>\s*<\/Card>", re.DOTALL)
m1 = vehicle_card_re.search(text)

cloud_card_re = re.compile(r"\{\/\* 2\. Cloud & Environment Simulation .*?\*\/\}\s*\{!showTripOnly && \(\s*<Card variant=\"outline\" shadow=\"sm\" borderRadius=\"xl\" borderColor=\"gray.200\">\s*<CardHeader .*?>.*?<\/CardHeader>\s*<CardBody>\s*(<VStack spacing=\{4\} align=\"stretch\">\s*<SimpleGrid.*?<\/VStack>)\s*<\/CardBody>\s*<\/Card>\s*\)", re.DOTALL)
m2 = cloud_card_re.search(text)

device_lifecycle_re = re.compile(r"\{\/\* 3\. Device Lifecycle & Remote Ops - HIDDEN BY USER REQUEST \*\/\}.*?<\/Card> \*\/\}", re.DOTALL)
m3 = device_lifecycle_re.search(text)

fota_card_re = re.compile(r"\{\/\* 4\. FOTA Update Center \(HIDDEN in Trip View\) \*\/\}\s*\{!showTripOnly && \(\s*<Card variant=\"outline\" shadow=\"sm\" borderRadius=\"xl\" borderColor=\"blue.200\" bg=\"blue.50\">\s*<CardBody p=\{4\}>\s*(<VStack align=\"stretch\" spacing=\{3\}>.*?<\/VStack>)\s*<\/CardBody>\s*<\/Card>\s*\)", re.DOTALL)
m4 = fota_card_re.search(text)

def build_panel(match, title, icon, color):
    # insert heading
    if not match: return ""
    content = match.group(1)
    heading = f'<HStack mb={{4}}><Icon as={{{icon}}} color="{color}" /><Heading size="md">{title}</Heading></HStack>'
    content = content.replace("<VStack spacing={{ base: 4, md: 5 }} align=\"stretch\">", f"<VStack spacing={{{{ base: 4, md: 5 }}}} align=\"stretch\">\n                                                {heading}")
    content = content.replace("<VStack spacing={4} align=\"stretch\">", f"<VStack spacing={{4}} align=\"stretch\">\n                                                {heading}")
    content = content.replace("<VStack align=\"stretch\" spacing={3}>", f"<VStack align=\"stretch\" spacing={{3}}>\n                                                {heading}")
    return content

p1 = f"<TabPanel>\n{build_panel(m1, 'Vehicle Controls', 'Car', 'blue.500')}\n</TabPanel>"
p2 = f"{{!showTripOnly && (<TabPanel>\n{build_panel(m2, 'Cloud Simulation', 'Shield', 'purple.500')}\n</TabPanel>)}}"
p3 = f"{{!showTripOnly && (<TabPanel>\n{build_panel(m4, 'FOTA Update Center', 'Activity', 'blue.600')}\n</TabPanel>)}}"

# print debugging
print("m1:", "found" if m1 else "not found")
print("m2:", "found" if m2 else "not found")
print("m3:", "found" if m3 else "not found")
print("m4:", "found" if m4 else "not found")

# Replace empty
for m in [m1, m2, m3, m4]:
    if m: text = text.replace(m.group(0), "")

# Append Panels to TabPanels
pattern_panels = r"(\s*)(<\/TabPanels>)"
replacement_panels = f"\\1                                    {p1}\\1                                    {p2}\\1                                    {p3}\\1\\2"
text = re.sub(pattern_panels, replacement_panels, text)

with open("src/components/RuleEngine/RuleEngineDashboard.jsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Patch applied successfully")
