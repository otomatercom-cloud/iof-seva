{
    "name": "IOF Volunteer ID Card",
    "version": "19.0.1.0.0",
    "summary": "Approved IOF volunteers become members and receive a digital ID card (PDF + QR verify)",
    "author": "Otomater",
    "website": "https://otomater.com",
    "license": "OPL-1",
    "category": "Customizations",
    "depends": ["iof_volunteer_registration", "association_membership"],
    "data": ["security/security.xml", "data/membership_type_data.xml", "report/card_templates.xml", "views/registration_views.xml"],
    "external_dependencies": {"python": ["qrcode"]},
    "installable": True,
}
