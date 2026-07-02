import { Text } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import { LanguageSelectSheet } from "../components/settings/LanguageSelectSheet";
import { I18nProvider, useI18n } from "../lib/i18n";

function LocaleProbe() {
  const { t } = useI18n();
  return <Text testID="probe">{t("settings.title")}</Text>;
}

describe("LanguageSelectSheet", () => {
  it("switches every translation to Norwegian when Norsk bokmål is picked", async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(
        <I18nProvider locale="en">
          <LanguageSelectSheet visible onClose={() => {}} />
          <LocaleProbe />
        </I18nProvider>,
      );
    });

    expect(tree.root.findByProps({ testID: "probe" }).props.children).toBe("Settings");

    const norsk = tree.root.findAllByType(Text).find((n) => n.props.children === "Norsk bokmål");
    expect(norsk).toBeDefined();

    // Walk up to the pressable row and fire its onPress.
    let node = norsk?.parent;
    while (node && typeof node.props.onPress !== "function") node = node.parent;
    expect(node).toBeDefined();
    await act(async () => {
      (node!.props.onPress as () => void)();
    });

    expect(tree.root.findByProps({ testID: "probe" }).props.children).toBe("Innstillinger");

    await act(async () => {
      tree.unmount();
    });
  });
});
