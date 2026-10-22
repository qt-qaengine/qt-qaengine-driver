#!/usr/bin/python3

from appium import webdriver
from appium.options.common.base import AppiumOptions

def get_driver():
    appium_socket = 'http://localhost:4723'
    options = AppiumOptions()
    options.platform_name = 'QtQaEngine'
    options.automation_name = 'QtQaEngine'
    options.set_capability('deviceName', '127.0.0.1')
    options.set_capability('qtqaenginePort', 8900)
    options.set_capability('qtqaengineTimeout', 5 * 60 * 1000)
    return webdriver.Remote(appium_socket, options=options)

driver = get_driver()
